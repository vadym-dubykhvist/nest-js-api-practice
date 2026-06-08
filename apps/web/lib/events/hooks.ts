'use client';

import {
  useQuery,
  useSuspenseQuery,
  UseSuspenseQueryResult,
} from '@tanstack/react-query';

import type {
  EventsQuery,
  EventsResponse,
  TagsResponse,
} from '@events/shared-types';

import {
  eventQueryOptions,
  eventsQueryOptions,
  tagsQueryOptions,
} from '@/lib/events/queries';

/**
 * Client hooks = thin wrappers over the shared queryOptions. Consumption only;
 * the definitions (key + fetcher) live in lib/events/queries.ts so the server
 * can prefetch them too.
 */
export function useEvents(query?: EventsQuery) {
  return useQuery(eventsQueryOptions(query));
}

export function useEventsSuspense(
  query?: EventsQuery,
): UseSuspenseQueryResult<EventsResponse, Error> {
  return useSuspenseQuery(eventsQueryOptions(query));
}

export function useEvent(id: number) {
  return useQuery(eventQueryOptions(id));
}

export function useTags(): UseSuspenseQueryResult<TagsResponse, Error> {
  return useSuspenseQuery(tagsQueryOptions());
}
