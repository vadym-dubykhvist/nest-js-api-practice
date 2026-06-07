'use client';

import { Suspense } from 'react';

import { MapPin, Search } from 'lucide-react';

import EventsTags from '@/components/events/events-tags';
import { FilterInput } from '@/components/events/filter-input';

const inputFallback = (
  <div className="h-[40px] max-w-[230px] flex-1 animate-pulse rounded-[12px] bg-card" />
);

export default function EventsFilter() {
  return (
    <div className="mb-[26px] flex flex-wrap items-center gap-[9px]">
      <Suspense fallback={inputFallback}>
        <FilterInput param="search" placeholder="Search events…" icon={Search} />
      </Suspense>
      <Suspense fallback={inputFallback}>
        <FilterInput param="location" placeholder="Location…" icon={MapPin} />
      </Suspense>
      <Suspense fallback={null}>
        <EventsTags />
      </Suspense>
    </div>
  );
}
