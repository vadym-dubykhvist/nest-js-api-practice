import type { EventsQuery } from '@events/shared-types';

export const PAGE_SIZE = 20;

/** Raw `searchParams` shape for the events page. */
export interface EventsSearchParams {
  page?: string;
  tag?: string;
  search?: string;
  location?: string;
}

/**
 * Single place that turns the URL into an `EventsQuery` + page number. Used by
 * the server page to prefetch; the resulting `query` is passed down to the
 * client components so their `useSuspenseQuery` keys match the prefetch exactly.
 */
export function parseEventsSearchParams(sp: EventsSearchParams): {
  page: number;
  query: EventsQuery;
} {
  const page = Math.max(1, Number(sp.page) || 1);
  const tag = sp.tag?.trim() || undefined;
  const search = sp.search?.trim() || undefined;
  const location = sp.location?.trim() || undefined;

  return {
    page,
    query: {
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      tag,
      search,
      location,
    },
  };
}
