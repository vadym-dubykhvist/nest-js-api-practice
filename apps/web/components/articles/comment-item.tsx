'use client';

import { useState } from 'react';

import { Heart, Reply, Trash2 } from 'lucide-react';

import type { Comment } from '@events/shared-types';

import { Avatar } from '@/components/avatar';
import { useDeleteComment, useToggleCommentLike } from '@/lib/comments/hooks';
import { weekdayFmt } from '@/lib/events/event-format';

import { CommentForm } from './comment-form';

export function CommentItem({
  comment,
  slug,
  articleAuthor,
  currentUsername,
}: {
  comment: Comment;
  slug: string;
  articleAuthor: string;
  currentUsername?: string;
}) {
  const [replying, setReplying] = useState(false);
  const like = useToggleCommentLike(slug);
  const del = useDeleteComment(slug);

  const isLoggedIn = !!currentUsername;
  // Backend allows the comment author OR the article author to delete.
  const canDelete =
    isLoggedIn &&
    (currentUsername === comment.author.username ||
      currentUsername === articleAuthor);

  return (
    <div>
      <div className="flex gap-3">
        <Avatar
          username={comment.author.username}
          image={comment.author.image}
          className="h-9 w-9 rounded-full bg-elevated"
          textClassName="text-[0.7rem]"
        />

        <div className="flex-1">
          <div className="flex items-center gap-2 font-mono text-[0.74rem] text-muted-foreground">
            <span className="font-semibold text-foreground">
              @{comment.author.username}
            </span>
            <span>·</span>
            <span>{weekdayFmt.format(new Date(comment.createdAt))}</span>
          </div>

          <p className="mt-1.5 whitespace-pre-wrap text-[0.95rem] leading-[1.5]">
            {comment.body}
          </p>

          <div className="mt-2 flex items-center gap-4 text-[0.78rem] text-muted-foreground">
            {isLoggedIn ? (
              <button
                type="button"
                onClick={() =>
                  like.mutate({ id: comment.id, liked: comment.liked })
                }
                disabled={like.isPending}
                aria-pressed={comment.liked}
                className={`inline-flex items-center gap-1.5 transition hover:text-foreground disabled:opacity-50 ${
                  comment.liked ? 'text-live' : ''
                }`}
              >
                <Heart
                  width={14}
                  height={14}
                  fill={comment.liked ? 'currentColor' : 'none'}
                />
                {comment.likesCount}
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <Heart width={14} height={14} />
                {comment.likesCount}
              </span>
            )}

            {isLoggedIn && (
              <button
                type="button"
                onClick={() => setReplying((v) => !v)}
                className="inline-flex items-center gap-1.5 transition hover:text-foreground"
              >
                <Reply width={14} height={14} />
                Reply
              </button>
            )}

            {canDelete && (
              <button
                type="button"
                onClick={() => del.mutate(comment.id)}
                disabled={del.isPending}
                aria-label="Delete comment"
                className="inline-flex items-center gap-1.5 transition hover:text-destructive disabled:opacity-50"
              >
                <Trash2 width={14} height={14} />
              </button>
            )}
          </div>

          {replying && (
            <div className="mt-3">
              <CommentForm
                slug={slug}
                parentId={comment.id}
                placeholder="Write a reply…"
                submitLabel="Reply"
                autoFocus
                onDone={() => setReplying(false)}
              />
            </div>
          )}
        </div>
      </div>

      {comment.replies.length > 0 && (
        <div className="mt-4 ml-[18px] flex flex-col gap-4 border-l border-border pl-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              slug={slug}
              articleAuthor={articleAuthor}
              currentUsername={currentUsername}
            />
          ))}
        </div>
      )}
    </div>
  );
}
