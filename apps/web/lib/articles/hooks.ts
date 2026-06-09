'use client';

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
  type UseSuspenseQueryResult,
} from '@tanstack/react-query';

import { api } from '@events/api-client';
import type {
  ArticleResponse,
  ArticlesQuery,
  ArticlesResponse,
  CreateArticleInput,
  UpdateArticleInput,
} from '@events/shared-types';

import {
  articleKeys,
  articleQueryOptions,
  articlesQueryOptions,
  authorArticlesQueryOptions,
  eventArticlesQueryOptions,
} from '@/lib/articles/queries';
import { getToken } from '@/lib/auth/token';

export function useEventArticlesSuspense(
  eventId: number,
): UseSuspenseQueryResult<ArticlesResponse, Error> {
  return useSuspenseQuery(eventArticlesQueryOptions(eventId, getToken()));
}

export function useAuthorArticlesSuspense(
  username: string,
): UseSuspenseQueryResult<ArticlesResponse, Error> {
  return useSuspenseQuery(authorArticlesQueryOptions(username, getToken()));
}

export function useArticlesSuspense(
  query?: ArticlesQuery,
): UseSuspenseQueryResult<ArticlesResponse, Error> {
  return useSuspenseQuery(articlesQueryOptions(query));
}

export function useArticleSuspense(
  slug: string,
): UseSuspenseQueryResult<ArticleResponse, Error> {
  return useSuspenseQuery(articleQueryOptions(slug, getToken()));
}

/** Create an article (authenticated). Refreshes every article list on success. */
export function useCreateArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateArticleInput) =>
      api.articles.create(input, { token: getToken() ?? undefined }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: articleKeys.all }),
  });
}

/** Update an article (author only — the backend 403s otherwise). */
export function useUpdateArticle(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateArticleInput) =>
      api.articles.update(slug, input, { token: getToken() ?? undefined }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: articleKeys.all }),
  });
}

/**
 * Favorite toggle on the single-article page. Optimistic flip of `favorited` +
 * `favoritesCount` on the cached detail (same shape as useToggleArticleFavorite,
 * but keyed by slug); reconciles every article view/list on settle.
 */
export function useFavoriteArticle(slug: string) {
  const queryClient = useQueryClient();
  const key = articleKeys.detail(slug);

  return useMutation({
    mutationFn: (favorited: boolean) => {
      const opts = { token: getToken() ?? undefined };
      return favorited
        ? api.articles.unfavorite(slug, opts)
        : api.articles.favorite(slug, opts);
    },
    onMutate: async (favorited) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ArticleResponse>(key);
      queryClient.setQueryData<ArticleResponse>(key, (old) =>
        old
          ? {
              article: {
                ...old.article,
                favorited: !favorited,
                favoritesCount: old.article.favoritesCount + (favorited ? -1 : 1),
              },
            }
          : old,
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: articleKeys.all }),
  });
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
