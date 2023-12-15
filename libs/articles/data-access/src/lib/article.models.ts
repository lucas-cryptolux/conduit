export interface ArticleFormData {
  title: string;
  description: string;
  body: string;
  tagList: string; // untransformed, comma-separated tags
}

export interface ArticleData {
  title: string;
  description: string;
  body: string;
  tagList: string[]; // transformed, array of tags
}

