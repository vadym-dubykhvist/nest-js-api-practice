import Link from 'next/link';

import { Heart, MessageSquare } from 'lucide-react';

import type { Article } from '@events/shared-types';

/**
 * Article card for the profile grid. There's no standalone article page, so the
 * card links to the event the article belongs to (the "↳ Event" eyebrow). An
 * article without an event renders as a plain, non-linked card.
 */
export function ProfileArticleCard({ article }: { article: Article }) {
  const inner = (
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
  );

  if (!article.event) {
    return <div className="card overflow-hidden">{inner}</div>;
  }

  return (
    <Link
      href={`/events/${article.event.id}`}
      className="card block overflow-hidden transition duration-150 hover:-translate-y-1 hover:border-border-strong"
    >
      {inner}
    </Link>
  );
}
