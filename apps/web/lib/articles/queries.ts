import { queryOptions } from '@tanstack/react-query';

import { api } from '@events/api-client';
import type { ArticlesQuery } from '@events/shared-types';

/**
 * Query keys + factories for articles. Same shape as lib/events/queries.ts so
 * a Server Component can prefetch and the client hooks reuse the same keys.
 */
export const articleKeys = {
  all: ['articles'] as const,
  list: (query?: ArticlesQuery) => ['articles', 'list', query ?? {}] as const,
  detail: (slug: string) => ['articles', 'detail', slug] as const,
};

/**
 * Articles attached to a given event — the detail page's "Articles" section.
 * Token-aware so the backend can compute `favorited` for the current user
 * (same pattern as eventQueryOptions).
 */
export function eventArticlesQueryOptions(eventId: number, token?: string | null) {
  const query: ArticlesQuery = { event: eventId };
  return queryOptions({
    queryKey: articleKeys.list(query),
    queryFn: () => api.articles.list(query, token ? { token } : undefined),
    enabled: Number.isFinite(eventId),
  });
}
