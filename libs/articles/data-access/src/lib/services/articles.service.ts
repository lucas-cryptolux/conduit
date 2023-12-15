import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@realworld/core/http-client';
import {
  Article,
  ArticleResponse,
  MultipleCommentsResponse,
  SingleCommentResponse,
  StartEditingArticleResponse,
} from '@realworld/core/api-types';
import { ArticleFormModel } from '../models/article-form.model';
import { ArticleSubmission } from '../models/article-submission.model';
import { ArticleListConfig } from '../+state/article-list/article-list.reducer';
import { HttpParams } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ArticlesService {
  constructor(private apiService: ApiService) {}

  getArticle(slug: string): Observable<ArticleResponse> {
    return this.apiService.get<ArticleResponse>('/articles/' + slug);
  }

  startEditing(slug: string): Observable<StartEditingArticleResponse> {
    return this.apiService.post<StartEditingArticleResponse, unknown>(`/articles/${slug}/edit`, {});
  }

  getComments(slug: string): Observable<MultipleCommentsResponse> {
    return this.apiService.get<MultipleCommentsResponse>(`/articles/${slug}/comments`);
  }

  deleteArticle(slug: string): Observable<void> {
    return this.apiService.delete<void>('/articles/' + slug);
  }

  deleteComment(commentId: number, slug: string): Observable<void> {
    return this.apiService.delete<void>(`/articles/${slug}/comments/${commentId}`);
  }

  addComment(slug: string, payload = ''): Observable<SingleCommentResponse> {
    return this.apiService.post<SingleCommentResponse, { comment: { body: string } }>(`/articles/${slug}/comments`, {
      comment: { body: payload },
    });
  }

  query(config: ArticleListConfig): Observable<{ articles: Article[]; articlesCount: number }> {
    return this.apiService.get(
      '/articles' + (config.type === 'FEED' ? '/feed' : ''),
      this.toHttpParams(config.filters),
    );
  }

  publishArticle(articleForm: ArticleFormModel): Observable<ArticleResponse> {
    // Transform tagList from string to array of strings
    const articleSubmission: ArticleSubmission = {
      ...articleForm,
      tagList:
        typeof articleForm.tagList === 'string'
          ? articleForm.tagList.split(',').map((tag) => tag.trim())
          : articleForm.tagList,
    };

    if (articleForm.slug) {
      return this.apiService.put<ArticleResponse, { article: ArticleSubmission }>('/articles/' + articleForm.slug, {
        article: articleSubmission,
      });
    }
    return this.apiService.post<ArticleResponse, { article: ArticleSubmission }>('/articles/', {
      article: articleSubmission,
    });
  }

  // TODO: remove any
  private toHttpParams(params: any) {
    return Object.getOwnPropertyNames(params).reduce((p, key) => p.set(key, params[key]), new HttpParams());
  }
}
