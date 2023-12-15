import { Profile } from './profile';

export interface Article {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  author: Profile;
  coauthors: Profile[];
}

export interface ArticleResponse {
  article: Article;
}

export type StartEditingArticleResponse =
  | {
      success: true;
    }
  | undefined;
