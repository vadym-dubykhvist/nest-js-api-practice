/** Fallback while the article (header + body) streams in. */
export function ArticleSkeleton() {
  return (
    <div className="mx-auto max-w-[720px] animate-pulse">
      <div className="h-3 w-32 rounded bg-elevated" />
      <div className="mt-4 h-10 w-3/4 rounded bg-elevated" />
      <div className="mt-6 flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-elevated" />
        <div className="h-4 w-40 rounded bg-elevated" />
      </div>
      <div className="mt-8 flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-4 w-full rounded bg-elevated" />
        ))}
      </div>
    </div>
  );
}

/** Fallback for the comments section's inner <Suspense>. */
export function CommentsSkeleton() {
  return (
    <div className="mt-6 flex animate-pulse flex-col gap-5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <div className="h-9 w-9 shrink-0 rounded-full bg-elevated" />
          <div className="flex-1">
            <div className="h-3 w-32 rounded bg-elevated" />
            <div className="mt-2 h-4 w-full rounded bg-elevated" />
          </div>
        </div>
      ))}
    </div>
  );
}
