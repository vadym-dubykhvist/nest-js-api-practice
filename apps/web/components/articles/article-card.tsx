import Link from 'next/link';

import { Heart, MessageSquare } from 'lucide-react';

import type { Article } from '@events/shared-types';

/** Shared by the profile tab and the global /articles feed so they line up. */
export const articlesGridClassName =
  'grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5';

/**
 * Article card for grids. Links to the article page; the "↳ Event" eyebrow shows
 * which event it belongs to (the article page links back there).
 */
export function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="card block overflow-hidden transition duration-150 hover:-translate-y-1 hover:border-border-strong"
    >
      <div className="flex flex-col gap-2 p-[16px_18px_18px]">
        {article.event && (
          <div className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.06em] text-primary">
            ↳ {article.event.title}
          </div>
        )}
        <h3 className="anton text-[1.4rem] leading-[1.05]">{article.title}</h3>
        {article.description && (
          <p className="line-clamp-2 text-[0.85rem] leading-[1.5] text-muted-foreground">
            {article.description}
          </p>
        )}
        <div className="metarow mt-1 text-[0.78rem]">
          <span className="inline-flex items-center gap-1.5">
            <Heart width={14} height={14} />
            {article.favoritesCount}
          </span>
          {typeof article.commentsCount === 'number' && (
            <span className="inline-flex items-center gap-1.5">
              <MessageSquare width={14} height={14} />
              {article.commentsCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
