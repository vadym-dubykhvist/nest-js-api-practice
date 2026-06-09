'use client';

import { Suspense } from 'react';
import Link from 'next/link';

import { Calendar } from 'lucide-react';

import { Avatar } from '@/components/avatar';
import { useArticleSuspense } from '@/lib/articles/hooks';
import { useCurrentUser } from '@/lib/auth/hooks';
import { weekdayFmt } from '@/lib/events/event-format';

import { ArticleFavoriteButton } from './article-favorite-button';
import { CommentsSkeleton } from './article-skeleton';
import { Comments } from './comments';

export function ArticleView({ slug }: { slug: string }) {
  const { data } = useArticleSuspense(slug);
  const { data: user } = useCurrentUser();
  const article = data.article;
  const created = new Date(article.createdAt);
  const isAuthor = user?.username === article.author.username;

  return (
    <article className="mx-auto max-w-[720px]">
      {article.event && (
        <Link
          href={`/events/${article.event.id}`}
          className="inline-block font-mono text-[0.72rem] font-bold uppercase tracking-[0.14em] text-primary hover:underline"
        >
          ↳ {article.event.title}
        </Link>
      )}

      <h1 className="anton mt-2 text-[clamp(2rem,5vw,3.2rem)] leading-[0.98]">
        {article.title}
      </h1>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link
          href={`/profile/${article.author.username}`}
          className="group flex items-center gap-3"
        >
          <Avatar
            username={article.author.username}
            image={article.author.image}
            className="h-11 w-11 rounded-full bg-elevated"
            textClassName="text-xs"
          />
          <span className="text-sm font-semibold group-hover:text-primary">
            @{article.author.username}
          </span>
        </Link>
        <span className="inline-flex items-center gap-1.5 font-mono text-[0.78rem] text-muted-foreground">
          <Calendar width={14} height={14} />
          {weekdayFmt.format(created)}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {isAuthor && (
            <Link
              href={`/articles/${article.slug}/edit`}
              className="btn btn-outline"
            >
              Edit
            </Link>
          )}
          <ArticleFavoriteButton article={article} />
        </div>
      </div>

      {article.tagList.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {article.tagList.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      {article.description && (
        <p className="mt-6 text-[1.15rem] leading-[1.6] text-foreground/80">
          {article.description}
        </p>
      )}

      <div className="mt-6 whitespace-pre-wrap text-[1.02rem] leading-[1.8] text-foreground/90">
        {article.body}
      </div>

      <Suspense fallback={<CommentsSkeleton />}>
        <Comments slug={slug} articleAuthor={article.author.username} />
      </Suspense>
    </article>
  );
}
