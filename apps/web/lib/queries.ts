'use client';

/**
 * Example TanStack Query hooks + key factory. Use these as the pattern when
 * adding more resources (articles, comments, profiles, auth mutations...).
 * For authenticated calls, pass `{ token }` through to the api-client.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '@events/api-client';
import type { EventsQuery } from '@events/shared-types';

export const queryKeys = {
  events: {
    all: ['events'] as const,
    list: (query?: EventsQuery) => ['events', 'list', query ?? {}] as const,
    detail: (id: number) => ['events', 'detail', id] as const,
  },
  tags: ['tags'] as const,
};

export function useEventsQuery(query?: EventsQuery) {
  return useQuery({
    queryKey: queryKeys.events.list(query),
    queryFn: () => api.events.list(query),
  });
}

export function useEventQuery(id: number) {
  return useQuery({
    queryKey: queryKeys.events.detail(id),
    queryFn: () => api.events.get(id),
    enabled: Number.isFinite(id),
  });
}

export function useTagsQuery() {
  return useQuery({
    queryKey: queryKeys.tags,
    queryFn: () => api.tags.list(),
  });
}
