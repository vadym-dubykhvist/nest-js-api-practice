import { queryOptions } from '@tanstack/react-query';

import { api } from '@events/api-client';
import type { EventsQuery } from '@events/shared-types';

/**
 * Query keys + `queryOptions` factories for events & tags. Plain functions
 * (no hooks) so a Server Component can reuse them for prefetch — same pattern
 * as lib/auth/queries.ts. The client hooks live in lib/events/hooks.ts.
 */
export const eventKeys = {
  all: ['events'] as const,
  list: (query?: EventsQuery) => ['events', 'list', query ?? {}] as const,
  detail: (id: number) => ['events', 'detail', id] as const,
};

export const tagKeys = {
  all: ['tags'] as const,
};

export function eventsQueryOptions(query?: EventsQuery) {
  return queryOptions({
    queryKey: eventKeys.list(query),
    queryFn: () => api.events.list(query),
  });
}

/**
 * Single event, enriched with per-user fields (registered, myRating) by the
 * backend. Token-aware like currentUserQueryOptions: the server passes the
 * cookie token at prefetch, the client hook passes it from the browser cookie —
 * same key both sides, so SSR + hydration stay consistent. queryClient.clear()
 * on logout drops the personalized copy.
 */
export function eventQueryOptions(id: number, token?: string | null) {
  return queryOptions({
    queryKey: eventKeys.detail(id),
    queryFn: () => api.events.get(id, token ? { token } : undefined),
    enabled: Number.isFinite(id),
    // Keep the live "going" count (and rating) fresh while the page is open.
    // Client-only: SSR prefetch fetches once; the browser observer polls every
    // 15s, in the foreground only (default refetchIntervalInBackground: false).
    refetchInterval: 15_000,
  });
}

export function tagsQueryOptions() {
  return queryOptions({
    queryKey: tagKeys.all,
    queryFn: () => api.tags.list(),
  });
}
