import { queryOptions } from '@tanstack/react-query';

import { api } from '@events/api-client';

/**
 * Comment query keys + factory. Token-aware so the backend computes `liked` for
 * the current viewer (same pattern as the event/article queries). Keyed by the
 * article slug; the server prefetches and the client hook reads the hydrated tree.
 */
export const commentKeys = {
  all: ['comments'] as const,
  list: (slug: string) => ['comments', 'list', slug] as const,
};

export function commentsQueryOptions(slug: string, token?: string | null) {
  return queryOptions({
    queryKey: commentKeys.list(slug),
    queryFn: () => api.comments.list(slug, token ? { token } : undefined),
    enabled: !!slug,
  });
}
