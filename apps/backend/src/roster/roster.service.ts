import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { User } from '../user/user.entity';
import { Article } from '../article/article.entity';

@Injectable()
export class RosterService {
  constructor(private readonly entityManager: EntityManager) {}

  async getRosterStats() {
    const users = await this.entityManager.find(User, {}, {
      populate: ['articles'],
    });

    return users.map(user => {
      const totalFavorites = user.articles.getItems().reduce((acc, article) => acc + article.favoritesCount, 0);
      const firstArticleDate = user.articles.getItems().reduce((acc: Date | null, article) => {
        return acc ? (acc < article.createdAt ? acc : article.createdAt) : article.createdAt;
      }, null);

      return {
        username: user.username,
        profileLink: `/profile/${user.username}`,
        articleCount: user.articles.length,
        totalFavorites: totalFavorites,
        firstArticleDate: firstArticleDate ? firstArticleDate.toISOString() : '',
      };
    }).sort((a, b) => b.totalFavorites - a.totalFavorites);
  }
}
