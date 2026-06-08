'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useTags } from '@/lib/events/hooks';

export default function EventsTags() {
  const { data } = useTags();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTag = searchParams.get('tag');

  // Click a tag to filter, click the active one again to clear. Reset page.
  const toggleTag = (tag: string) => {
    const params = new URLSearchParams(searchParams);
    if (activeTag === tag) params.delete('tag');
    else params.set('tag', tag);
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <>
      {data.tags.map((tag) => {
        const active = activeTag === tag;
        return (
          <button
            key={tag}
            type="button"
            aria-pressed={active}
            onClick={() => toggleTag(tag)}
            className={`inline-flex cursor-pointer items-center gap-[7px] rounded-[10px] border p-[9px_14px] text-[0.85rem] font-medium transition ${
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border-strong bg-card hover:border-foreground'
            }`}
          >
            {tag}
          </button>
        );
      })}
    </>
  );
}
