import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager, LoadStrategy, QueryOrder, wrap } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/mysql';

import { TagService } from '../tag/tag.service';
import { User } from '../user/user.entity';
import { Article } from './article.entity';
import { IArticleRO, IArticlesRO, ICommentsRO } from './article.interface';
import { Comment } from './comment.entity';
import { CreateArticleDto, CreateCommentDto } from './dto';

@Injectable()
export class ArticleService {
  constructor(
    private readonly em: EntityManager,
    @InjectRepository(Article)
    private readonly articleRepository: EntityRepository<Article>,
    @InjectRepository(Comment)
    private readonly commentRepository: EntityRepository<Comment>,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    private readonly tagService: TagService,
  ) {}

  private articleLocks = new Map<string, { userId: number; expiration: Date }>();

  async findAll(userId: number, query: Record<string, string>): Promise<IArticlesRO> {
    const user = userId
      ? await this.userRepository.findOne(userId, { populate: ['followers', 'favorites'] })
      : undefined;
    const qb = this.articleRepository
      .createQueryBuilder('a')
      .select('a.*')
      .leftJoin('a.author', 'u')
      .leftJoinAndSelect('a.coauthors', 'c', {});

    if ('tag' in query) {
      qb.andWhere({ tagList: new RegExp(query.tag) });
    }

    if ('author' in query) {
      const author = await this.userRepository.findOne({ username: query.author });

      if (!author) {
        return { articles: [], articlesCount: 0 };
      }

      qb.andWhere({ author: author.id });
    }

    if ('favorited' in query) {
      const author = await this.userRepository.findOne({ username: query.favorited }, { populate: ['favorites'] });

      if (!author) {
        return { articles: [], articlesCount: 0 };
      }

      const ids = author.favorites.$.getIdentifiers();
      qb.andWhere({ author: ids });
    }

    qb.orderBy({ createdAt: QueryOrder.DESC });
    const res = await qb.clone().count('id', true).execute('get');
    const articlesCount = res.count;

    if ('limit' in query) {
      qb.limit(+query.limit);
    }

    if ('offset' in query) {
      qb.offset(+query.offset);
    }

    const articles = await qb.getResult();

    return { articles: articles.map((a) => a.toJSON(user!)), articlesCount };
  }

  async findFeed(userId: number, query: Record<string, string>): Promise<IArticlesRO> {
    const user = userId
      ? await this.userRepository.findOne(userId, { populate: ['followers', 'favorites'] })
      : undefined;
    const res = await this.articleRepository.findAndCount(
      { author: { followers: userId } },
      {
        populate: ['author'],
        orderBy: { createdAt: QueryOrder.DESC },
        limit: +query.limit,
        offset: +query.offset,
      },
    );

    console.log('findFeed', { articles: res[0], articlesCount: res[1] });
    return { articles: res[0].map((a) => a.toJSON(user!)), articlesCount: res[1] };
  }

  async findOne(userId: number, where: Partial<Article>): Promise<IArticleRO> {
    const user = userId
      ? await this.userRepository.findOneOrFail(userId, { populate: ['followers', 'favorites'] })
      : undefined;
    const article = await this.articleRepository.findOne(where, { populate: ['author', 'coauthors'] });
    return { article: article && article.toJSON(user) } as IArticleRO;
  }

  async addComment(userId: number, slug: string, dto: CreateCommentDto) {
    const article = await this.articleRepository.findOneOrFail({ slug }, { populate: ['author'] });
    const author = await this.userRepository.findOneOrFail(userId);
    const comment = new Comment(author, article, dto.body);
    await this.em.persistAndFlush(comment);

    return { comment, article: article.toJSON(author) };
  }

  async deleteComment(userId: number, slug: string, id: number): Promise<IArticleRO> {
    const article = await this.articleRepository.findOneOrFail({ slug }, { populate: ['author'] });
    const user = await this.userRepository.findOneOrFail(userId);
    const comment = this.commentRepository.getReference(id);

    if (article.comments.contains(comment)) {
      article.comments.remove(comment);
      await this.em.removeAndFlush(comment);
    }

    return { article: article.toJSON(user) };
  }

  async favorite(id: number, slug: string): Promise<IArticleRO> {
    const article = await this.articleRepository.findOneOrFail({ slug }, { populate: ['author'] });
    const user = await this.userRepository.findOneOrFail(id, { populate: ['favorites', 'followers'] });

    if (!user.favorites.contains(article)) {
      user.favorites.add(article);
      article.favoritesCount++;
    }

    await this.em.flush();
    return { article: article.toJSON(user) };
  }

  async unFavorite(id: number, slug: string): Promise<IArticleRO> {
    const article = await this.articleRepository.findOneOrFail({ slug }, { populate: ['author'] });
    const user = await this.userRepository.findOneOrFail(id, { populate: ['followers', 'favorites'] });

    if (user.favorites.contains(article)) {
      user.favorites.remove(article);
      article.favoritesCount--;
    }

    await this.em.flush();
    return { article: article.toJSON(user) };
  }

  async findComments(slug: string): Promise<ICommentsRO> {
    const article = await this.articleRepository.findOne({ slug }, { populate: ['comments'] });
    return { comments: article!.comments.getItems() };
  }

  async create(userId: number, dto: CreateArticleDto) {
    const user = await this.userRepository.findOne(
      { id: userId },
      { populate: ['followers', 'favorites', 'articles'] },
    );
    const article = new Article(user!, dto.title, dto.description, dto.body);
    article.tagList.push(...dto.tagList);
    if (dto.tagList && dto.tagList.length) {
      await this.tagService.findOrCreateTags(dto.tagList);
    }

    user?.articles.add(article);
    await this.em.flush();

    return { article: article.toJSON(user!) };
  }

  async startEditing(userId: number, slug: string) {
    const lock = this.articleLocks.get(slug);
    const now = new Date();

    if (lock && lock.userId !== userId && lock.expiration > now) {
      throw new HttpException('Article is already being edited', HttpStatus.FORBIDDEN);
    }

    const article = await this.articleRepository.findOne({
      slug,
      $or: [{ author: userId }, { coauthors: { $in: [this.em.getReference(User, userId)] } }],
    });
    if (!article) {
      throw new HttpException('Article not found', HttpStatus.NOT_FOUND);
    }

    const expiration = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    this.articleLocks.set(slug, { userId, expiration });

    return { success: true };
  }

  async update(userId: number, slug: string, articleData: any): Promise<IArticleRO> {
    const user = await this.userRepository.findOne(
      { id: userId },
      { populate: ['followers', 'favorites', 'articles'] },
    );
    const article = await this.articleRepository.findOne({ slug }, { populate: ['author'] });
    if (!article) {
      throw new Error('Article not found');
    }

    const lock = this.articleLocks.get(slug);
    if (lock === undefined || lock.userId !== userId) {
      throw new HttpException('You are not allowed to edit this article', HttpStatus.FORBIDDEN);
    }

    if (articleData.tagList) {
      // Assuming articleData.tagList is an array of tag names
      // And assuming Article entity has a tagList property
      const tags = await this.tagService.findOrCreateTags(articleData.tagList);
      article.tagList = tags.map((tag) => tag.tag);
    }

    // Update only the fields that are allowed to change (i.e. not created_at)
    article.title = articleData.title ?? article.title;
    article.description = articleData.description ?? article.description;
    article.body = articleData.body ?? article.body;

    await this.em.flush();

    this.articleLocks.delete(slug);

    return { article: article!.toJSON(user!) };
  }

  async delete(slug: string) {
    return this.articleRepository.nativeDelete({ slug });
  }
}
