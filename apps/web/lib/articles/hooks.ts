'use client';

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
  type UseSuspenseQueryResult,
} from '@tanstack/react-query';

import { api } from '@events/api-client';
import type { ArticlesResponse } from '@events/shared-types';

import { articleKeys, eventArticlesQueryOptions } from '@/lib/articles/queries';
import { getToken } from '@/lib/auth/token';

export function useEventArticlesSuspense(
  eventId: number,
): UseSuspenseQueryResult<ArticlesResponse, Error> {
  return useSuspenseQuery(eventArticlesQueryOptions(eventId, getToken()));
}

/**
 * Toggle favorite on an article in an event's list. Optimistic: flips
 * `favorited` and nudges `favoritesCount` in the cached list immediately,
 * rolls back on error, and reconciles with the server on settle.
 */
export function useToggleArticleFavorite(eventId: number) {
  const queryClient = useQueryClient();
  const key = articleKeys.list({ event: eventId });

  return useMutation({
    mutationFn: ({ slug, favorited }: { slug: string; favorited: boolean }) => {
      const opts = { token: getToken() ?? undefined };
      return favorited
        ? api.articles.unfavorite(slug, opts)
        : api.articles.favorite(slug, opts);
    },
    onMutate: async ({ slug, favorited }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ArticlesResponse>(key);
      queryClient.setQueryData<ArticlesResponse>(key, (old) =>
        old
          ? {
              ...old,
              articles: old.articles.map((article) =>
                article.slug === slug
                  ? {
                      ...article,
                      favorited: !favorited,
                      favoritesCount: article.favoritesCount + (favorited ? -1 : 1),
                    }
                  : article,
              ),
            }
          : old,
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}
