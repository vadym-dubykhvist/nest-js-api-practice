'use client';

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
  type UseSuspenseQueryResult,
} from '@tanstack/react-query';

import { api } from '@events/api-client';
import type {
  Comment,
  CommentsResponse,
  CreateCommentInput,
} from '@events/shared-types';

import { articleKeys } from '@/lib/articles/queries';
import { getToken } from '@/lib/auth/token';
import { commentKeys, commentsQueryOptions } from '@/lib/comments/queries';

export function useCommentsSuspense(
  slug: string,
): UseSuspenseQueryResult<CommentsResponse, Error> {
  return useSuspenseQuery(commentsQueryOptions(slug, getToken()));
}

/**
 * Post a comment (top-level, or a reply when `parentId` is set). Non-optimistic:
 * the server assigns id/createdAt and slots it into the tree, so we just refetch
 * the comments (and the article, for its commentsCount) on success.
 */
export function useCreateComment(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCommentInput) =>
      api.comments.create(slug, input, { token: getToken() ?? undefined }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: commentKeys.list(slug) });
      void queryClient.invalidateQueries({ queryKey: articleKeys.detail(slug) });
    },
  });
}

export function useDeleteComment(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      api.comments.remove(slug, id, { token: getToken() ?? undefined }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: commentKeys.list(slug) });
      void queryClient.invalidateQueries({ queryKey: articleKeys.detail(slug) });
    },
  });
}

/**
 * Like / unlike a comment. Optimistic: flips `liked` + `likesCount` on the one
 * comment inside the nested tree, rolls back on error, reconciles on settle.
 */
export function useToggleCommentLike(slug: string) {
  const queryClient = useQueryClient();
  const key = commentKeys.list(slug);

  return useMutation({
    mutationFn: ({ id, liked }: { id: number; liked: boolean }) => {
      const opts = { token: getToken() ?? undefined };
      return liked ? api.comments.unlike(id, opts) : api.comments.like(id, opts);
    },
    onMutate: async ({ id, liked }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<CommentsResponse>(key);
      queryClient.setQueryData<CommentsResponse>(key, (old) =>
        old
          ? {
              comments: mapComment(old.comments, id, (comment) => ({
                ...comment,
                liked: !liked,
                likesCount: comment.likesCount + (liked ? -1 : 1),
              })),
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

/** Apply `fn` to the one comment with `id`, anywhere in the nested reply tree. */
function mapComment(
  comments: Comment[],
  id: number,
  fn: (comment: Comment) => Comment,
): Comment[] {
  return comments.map((comment) =>
    comment.id === id
      ? fn(comment)
      : { ...comment, replies: mapComment(comment.replies, id, fn) },
  );
}
