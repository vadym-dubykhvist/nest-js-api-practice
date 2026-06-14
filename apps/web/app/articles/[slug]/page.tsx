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
    const url = `/articles/${slug}`;
    return {
      title: article.title,
      description: article.description,
      alternates: { canonical: url },
      openGraph: {
        title: article.title,
        description: article.description,
        type: 'article',
        url,
        publishedTime: article.createdAt,
        authors: [`@${article.author.username}`],
      },
    };
  } catch {
    return {};
  }
}

export default function ArticlePage({ params }: Params) {
  // Static shell — it never touches params, so PPR prerenders it. The island
  // (params + cookie + article fetch) streams into the <Suspense> behind the
  // skeleton — same pattern as the event detail page.
  return (
    <main>
      <section className="pt-[54px] pb-24">
        <div className="wrap">
          <Suspense fallback={<ArticleSkeleton />}>
            <ArticleLoader params={params} />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
