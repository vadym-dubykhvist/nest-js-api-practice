export interface ArticlesQueryInterface {
  tag?: string;
  author?: string;
  limit?: number;
  offset?: number;
  favorited: string;
}
