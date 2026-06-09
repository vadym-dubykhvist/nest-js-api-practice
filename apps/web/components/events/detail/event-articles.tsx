'use client';

import Link from 'next/link';

import { Heart, MessageSquare } from 'lucide-react';

import {
  useEventArticlesSuspense,
  useToggleArticleFavorite,
} from '@/lib/articles/hooks';
import { useCurrentUser } from '@/lib/auth/hooks';

export function EventArticles({ eventId }: { eventId: number }) {
  const { data } = useEventArticlesSuspense(eventId);
  const { data: user } = useCurrentUser();
  const toggleFavorite = useToggleArticleFavorite(eventId);

  const articles = data.articles;
  if (articles.length === 0) return null;

  return (
    <>
      <div className="anton mt-[38px] mb-4 flex items-baseline gap-3 text-[1.7rem] uppercase">
        Articles
        <span className="font-mono text-[0.85rem] text-primary">
          / {String(articles.length).padStart(2, '0')}
        </span>
      </div>

      <div className="flex max-w-[580px] flex-col gap-3">
        {articles.map((article) => (
          <div
            key={article.slug}
            // `relative` anchors the title's stretched link (after:inset-0); the
            // heart sits above it (z-10) so it stays its own click target.
            className="relative rounded-[14px] border border-border bg-card p-[16px_18px] transition hover:translate-x-[3px] hover:border-border-strong"
          >
            <div className="mb-1.5 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-primary">
              ↳ part of this event
            </div>
            <Link
              href={`/articles/${article.slug}`}
              className="text-[1.04rem] font-semibold after:absolute after:inset-0"
            >
              {article.title}
            </Link>
            <div className="metarow mt-2 text-[0.78rem]">
              <span>@{article.author.username}</span>
              {user ? (
                <button
                  type="button"
                  onClick={() =>
                    toggleFavorite.mutate({
                      slug: article.slug,
                      favorited: !!article.favorited,
                    })
                  }
                  aria-pressed={!!article.favorited}
                  aria-label={article.favorited ? 'Unfavorite' : 'Favorite'}
                  className={`relative z-10 inline-flex cursor-pointer items-center gap-1.5 transition hover:text-foreground ${
                    article.favorited ? 'text-live' : ''
                  }`}
                >
                  <Heart
                    width={14}
                    height={14}
                    fill={article.favorited ? 'currentColor' : 'none'}
                  />
                  {article.favoritesCount}
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <Heart width={14} height={14} />
                  {article.favoritesCount}
                </span>
              )}
              {typeof article.commentsCount === 'number' && (
                <span className="inline-flex items-center gap-1.5">
                  <MessageSquare width={14} height={14} />
                  {article.commentsCount}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
