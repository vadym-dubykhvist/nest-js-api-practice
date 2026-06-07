import { eventsGridClassName } from '@/components/events/event-card';

function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-[4/5] animate-pulse bg-elevated" />
      <div className="flex flex-col gap-3 p-[16px_18px_18px]">
        <div className="flex items-center justify-between">
          <div className="h-5 w-20 animate-pulse rounded-[7px] bg-elevated" />
          <div className="h-4 w-10 animate-pulse rounded bg-elevated" />
        </div>
        <div className="h-4 w-3/4 animate-pulse rounded bg-elevated" />
        <div className="h-[5px] w-full animate-pulse rounded-full bg-elevated" />
      </div>
    </div>
  );
}

export function EventsGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className={eventsGridClassName} aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
