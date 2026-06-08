'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import type { LucideIcon } from 'lucide-react';

/**
 * A debounced text input bound to a single URL search param. Reused for the
 * `search` and `location` filters — same behaviour, different param/icon.
 */
export function FilterInput({
  param,
  placeholder,
  icon: Icon,
}: {
  param: string;
  placeholder: string;
  icon: LucideIcon;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get(param) ?? '');

  // Debounce so typing doesn't fire a navigation (and a request) per keystroke.
  useEffect(() => {
    const current = searchParams.get(param) ?? '';
    if (value === current) return;

    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (value) params.set(param, value);
      else params.delete(param);
      params.delete('page'); // any filter change resets to the first page
      router.replace(`${pathname}?${params.toString()}`);
    }, 350);

    return () => clearTimeout(timeout);
  }, [value, param, searchParams, pathname, router]);

  return (
    <label className="flex max-w-[230px] flex-1 items-center gap-[9px] rounded-[12px] border border-border-strong bg-card p-[9px_13px] text-muted-foreground">
      <Icon width={18} height={18} />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full bg-transparent text-[0.9rem] text-foreground outline-none placeholder:text-muted-foreground"
        placeholder={placeholder}
      />
    </label>
  );
}
