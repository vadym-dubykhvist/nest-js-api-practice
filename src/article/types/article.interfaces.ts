export interface ArticlesQueryInterface {
  tag?: string;
  author?: string;
  limit?: number;
  offset?: number;
  favorited?: string;
  event?: string;
}

export interface ArticlesFeedQueryInterface {
  limit?: number;
  offset?: number;
}
