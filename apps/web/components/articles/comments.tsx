'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { MessageCircle } from 'lucide-react';

import type { Comment } from '@events/shared-types';

import { useCurrentUser } from '@/lib/auth/hooks';
import { withNext } from '@/lib/auth/redirect';
import { useCommentsSuspense } from '@/lib/comments/hooks';

import { CommentForm } from './comment-form';
import { CommentItem } from './comment-item';

export function Comments({
  slug,
  articleAuthor,
}: {
  slug: string;
  articleAuthor: string;
}) {
  const { data } = useCommentsSuspense(slug);
  const { data: user } = useCurrentUser();
  const pathname = usePathname();
  const total = countComments(data.comments);

  return (
    <section className="mt-12 border-t border-border pt-8">
      <h2 className="anton flex items-center gap-2 text-[1.4rem] uppercase">
        <MessageCircle width={20} height={20} />
        {total} {total === 1 ? 'comment' : 'comments'}
      </h2>

      <div className="mt-5">
        {user ? (
          <CommentForm slug={slug} />
        ) : (
          <Link
            href={withNext('/login', pathname)}
            className="btn btn-outline btn-block"
          >
            Sign in to join the conversation
          </Link>
        )}
      </div>

      {data.comments.length > 0 && (
        <div className="mt-8 flex flex-col gap-6">
          {data.comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              slug={slug}
              articleAuthor={articleAuthor}
              currentUsername={user?.username}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/** Count the whole nested tree (comments + their replies). */
function countComments(comments: Comment[]): number {
  return comments.reduce(
    (sum, comment) => sum + 1 + countComments(comment.replies),
    0,
  );
}
