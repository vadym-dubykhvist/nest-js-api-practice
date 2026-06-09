import type { ArticlesQuery } from '@events/shared-types';

export const ARTICLES_PAGE_SIZE = 12;

/** Raw `searchParams` shape for the global articles feed. */
export interface ArticlesSearchParams {
  page?: string;
}

/** Turn the URL into an `ArticlesQuery` + page number (mirrors the events page). */
export function parseArticlesSearchParams(sp: ArticlesSearchParams): {
  page: number;
  query: ArticlesQuery;
} {
  const page = Math.max(1, Number(sp.page) || 1);
  return {
    page,
    query: {
      limit: ARTICLES_PAGE_SIZE,
      offset: (page - 1) * ARTICLES_PAGE_SIZE,
    },
  };
}
