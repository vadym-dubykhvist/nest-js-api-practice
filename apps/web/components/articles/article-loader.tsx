import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

import { ApiError } from '@events/api-client';

import { ArticleNotFound } from '@/components/articles/article-not-found';
import { ArticleView } from '@/components/articles/article-view';
import { loadArticle } from '@/lib/articles/load-article.server';
import { articleKeys } from '@/lib/articles/queries';
import { getServerToken } from '@/lib/auth/token.server';
import { commentsQueryOptions } from '@/lib/comments/queries';
import { getQueryClient } from '@/lib/get-query-client';

/**
 * Dynamic island for the article page (mirrors event-detail-loader): awaits
 * params, reads the cookie and fetches the article — all dynamic — inside the
 * page's <Suspense>, so the page shell prerenders (PPR). Seeds the article into
 * the cache and prefetches the comment tree, which then streams into its own
 * inner <Suspense>. A missing article renders inline.
 */
export async function ArticleLoader({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const token = await getServerToken();

  try {
    const { article } = await loadArticle(slug, token);

    const queryClient = getQueryClient();
    queryClient.setQueryData(articleKeys.detail(slug), { article });
    void queryClient.prefetchQuery(commentsQueryOptions(slug, token));

    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ArticleView slug={slug} />
      </HydrationBoundary>
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return <ArticleNotFound />;
    }
    throw error;
  }
}
