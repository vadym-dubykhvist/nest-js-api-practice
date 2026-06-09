'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import { ArrowLeft, ArrowRight } from 'lucide-react';

import type { ArticlesQuery } from '@events/shared-types';

import { useArticlesSuspense } from '@/lib/articles/hooks';

/** Mirrors EventsPagination: reads the same list query for the total count. */
export function ArticlesPagination({
  page,
  query,
}: {
  page: number;
  query: ArticlesQuery;
}) {
  const { data } = useArticlesSuspense(query);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hrefFor = (target: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(target));
    return `${pathname}?${params.toString()}`;
  };

  const offset = query.offset ?? 0;
  const hasPrev = page > 1;
  const hasNext = offset + data.articles.length < data.articlesCount;

  return (
    <div className="flex items-center gap-2">
      {hasPrev ? (
        <Link href={hrefFor(page - 1)} className="btn btn-outline">
          <ArrowLeft width={16} height={16} />
          Prev
        </Link>
      ) : (
        <span
          className="btn btn-outline pointer-events-none opacity-40"
          aria-disabled
        >
          <ArrowLeft width={16} height={16} />
          Prev
        </span>
      )}

      {hasNext ? (
        <Link href={hrefFor(page + 1)} className="btn btn-outline">
          Next
          <ArrowRight width={16} height={16} />
        </Link>
      ) : (
        <span
          className="btn btn-outline pointer-events-none opacity-40"
          aria-disabled
        >
          Next
          <ArrowRight width={16} height={16} />
        </span>
      )}
    </div>
  );
}
