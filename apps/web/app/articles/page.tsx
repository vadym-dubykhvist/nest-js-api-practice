import { Suspense } from 'react';
import type { Metadata } from 'next';

import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

import { ArticlesGridSkeleton } from '@/components/articles/articles-grid-skeleton';
import { ArticlesList } from '@/components/articles/articles-list';
import { ArticlesPagination } from '@/components/articles/articles-pagination';
import { articlesQueryOptions } from '@/lib/articles/queries';
import {
  type ArticlesSearchParams,
  parseArticlesSearchParams,
} from '@/lib/articles/search-params';
import { getQueryClient } from '@/lib/get-query-client';

export const metadata: Metadata = {
  title: 'Articles',
  description: 'Read what the community is publishing about events.',
};

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<ArticlesSearchParams>;
}) {
  const { page, query } = parseArticlesSearchParams(await searchParams);

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(articlesQueryOptions(query));

  return (
    <main>
      <section className="pt-[54px] pb-24">
        <div className="wrap">
          <HydrationBoundary state={dehydrate(queryClient)}>
            <div className="mb-[30px] flex flex-wrap items-end justify-between gap-6">
              <div>
                <div className="eyebrow">Read</div>
                <h2 className="anton mt-0.5 text-[69px] leading-[0.9]">
                  Articles<em className="not-italic text-primary">.</em>
                </h2>
              </div>
              <Suspense
                fallback={
                  <div className="h-[42px] w-[180px] animate-pulse rounded-[12px] bg-elevated" />
                }
              >
                <ArticlesPagination page={page} query={query} />
              </Suspense>
            </div>

            <Suspense fallback={<ArticlesGridSkeleton />}>
              <ArticlesList query={query} />
            </Suspense>
          </HydrationBoundary>
        </div>
      </section>
    </main>
  );
}
