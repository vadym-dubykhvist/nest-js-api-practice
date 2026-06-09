import { Suspense } from 'react';
import type { Metadata } from 'next';

import { ArticleLoader } from '@/components/articles/article-loader';
import { ArticleSkeleton } from '@/components/articles/article-skeleton';
import { loadArticle } from '@/lib/articles/load-article.server';
import { getServerToken } from '@/lib/auth/token.server';

type Params = { params: Promise<{ slug: string }> };

// Title only (deduped with the island via loadArticle's cache()). A missing
// article is owned by the island, which renders ArticleNotFound inline.
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { article } = await loadArticle(slug, await getServerToken());
    return { title: `${article.title} · Eventino` };
  } catch {
    return {};
  }
}

export default async function ArticlePage({ params }: Params) {
  const { slug } = await params;

  // Static shell; the island (cookie + article fetch) streams into the
  // <Suspense> behind the skeleton — same pattern as the event detail page.
  return (
    <main>
      <section className="pt-[54px] pb-24">
        <div className="wrap">
          <Suspense fallback={<ArticleSkeleton />}>
            <ArticleLoader slug={slug} />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
