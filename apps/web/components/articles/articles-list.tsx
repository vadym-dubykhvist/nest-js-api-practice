'use client';

import type { ArticlesQuery } from '@events/shared-types';

import {
  ArticleCard,
  articlesGridClassName,
} from '@/components/articles/article-card';
import { useArticlesSuspense } from '@/lib/articles/hooks';

export function ArticlesList({ query }: { query: ArticlesQuery }) {
  const { data } = useArticlesSuspense(query);
  const { articles } = data;

  if (articles.length === 0) {
    return (
      <p className="py-16 text-center font-mono text-[0.85rem] text-muted-foreground">
        No articles yet.
      </p>
    );
  }

  return (
    <div className={articlesGridClassName}>
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
