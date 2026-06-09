import { articlesGridClassName } from '@/components/articles/article-card';

export function ArticlesGridSkeleton() {
  return (
    <div className={articlesGridClassName}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-[160px] animate-pulse rounded-[16px] bg-elevated"
        />
      ))}
    </div>
  );
}
