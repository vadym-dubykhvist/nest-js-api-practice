function Block({ className }: { className: string }) {
  return <div className={`animate-pulse bg-elevated ${className}`} />;
}

export function EventArticlesSkeleton() {
  return (
    <div className="mt-[38px] flex max-w-[580px] flex-col gap-3" aria-hidden>
      <Block className="h-6 w-40 rounded-md" />
      <Block className="h-20 w-full rounded-[14px]" />
      <Block className="h-20 w-full rounded-[14px]" />
    </div>
  );
}

export function EventDetailSkeleton() {
  return (
    <div
      className="grid grid-cols-1 items-start gap-[38px] lg:grid-cols-[1fr_350px]"
      aria-hidden
    >
      <div>
        <Block className="aspect-[16/10] w-full rounded-[22px]" />
        <div className="mt-6 flex gap-3">
          <Block className="h-7 w-24 rounded-[7px]" />
          <Block className="h-7 w-28 rounded-[7px]" />
        </div>
        <Block className="mt-5 h-12 w-56 rounded-md" />
        <Block className="mt-4 h-24 w-full max-w-[60ch] rounded-md" />
      </div>
      <Block className="h-[340px] w-full rounded-[20px]" />
    </div>
  );
}
