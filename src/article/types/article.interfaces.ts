export interface ArticlesQueryInterface {
  tag?: string;
  author?: string;
  limit?: number;
  offset?: number;
  favorited?: string;
}

export interface ArticlesFeedQueryInterface {
  limit?: number;
  offset?: number;
}
