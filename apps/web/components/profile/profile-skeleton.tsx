/** Fallback for the profile tabs/grid while the lists stream in. */
export function ProfileContentSkeleton() {
  return (
    <>
      <div className="mt-7 mb-[22px] h-[44px] border-b border-border" />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-[170px] animate-pulse rounded-[16px] bg-elevated"
          />
        ))}
      </div>
    </>
  );
}
