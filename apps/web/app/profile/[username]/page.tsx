import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

import { ApiError } from '@events/api-client';

import { ProfileContent } from '@/components/profile/profile-content';
import { ProfileHeader } from '@/components/profile/profile-header';
import { ProfileContentSkeleton } from '@/components/profile/profile-skeleton';
import { authorArticlesQueryOptions } from '@/lib/articles/queries';
import { getServerToken } from '@/lib/auth/token.server';
import { eventsQueryOptions } from '@/lib/events/queries';
import { getQueryClient } from '@/lib/get-query-client';
import { loadProfile } from '@/lib/profile/load-profile.server';
import { profileKeys } from '@/lib/profile/queries';

type Params = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { username } = await params;
  try {
    const { profile } = await loadProfile(username, await getServerToken());
    const description = profile.bio || `@${profile.username} on Eventino`;
    const url = `/profile/${username}`;
    return {
      title: `@${profile.username}`,
      description,
      alternates: { canonical: url },
      openGraph: {
        title: `@${profile.username}`,
        description,
        type: 'profile',
        url,
        images: profile.image ? [{ url: profile.image }] : undefined,
      },
    };
  } catch {
    return {};
  }
}

export default async function ProfilePage({ params }: Params) {
  const { username } = await params;
  const token = await getServerToken();
  const queryClient = getQueryClient();

  // Await the profile so an unknown username is a real 404 before anything
  // streams; seed the cache so the client header reads it from hydration.
  try {
    const { profile } = await loadProfile(username, token);
    queryClient.setQueryData(profileKeys.detail(username), { profile });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  // Their hosted events + authored articles feed both the stat line and the tabs.
  await Promise.all([
    queryClient.prefetchQuery(eventsQueryOptions({ author: username })),
    queryClient.prefetchQuery(eventsQueryOptions({ attending: username })),
    queryClient.prefetchQuery(authorArticlesQueryOptions(username, token)),
  ]);

  return (
    <main>
      <section className="pt-8 pb-24">
        <div className="wrap">
          <HydrationBoundary state={dehydrate(queryClient)}>
            <ProfileHeader username={username} />
            <Suspense fallback={<ProfileContentSkeleton />}>
              <ProfileContent username={username} serverNow={Date.now()} />
            </Suspense>
          </HydrationBoundary>
        </div>
      </section>
    </main>
  );
}
