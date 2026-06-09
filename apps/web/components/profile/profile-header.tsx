'use client';

import { FollowButton } from '@/components/profile/follow-button';
import { useEvents } from '@/lib/events/hooks';
import { useProfileSuspense } from '@/lib/profile/hooks';

// Fixed brand gradients from the mockup: violet→cyan banner, pink→amber avatar.
const BANNER = 'linear-gradient(150deg,#7b5cff,#3dcbff)';
const AVATAR = 'linear-gradient(135deg,#ff3d8b,#ffc53a)';

export function ProfileHeader({ username }: { username: string }) {
  const { data } = useProfileSuspense(username);
  const profile = data.profile;

  // Counts for the stat line — read from the same prefetched list queries the
  // tabs use, so they're already in cache (no extra request, no flash).
  const hosting = useEvents({ author: username }).data?.eventsCount ?? 0;
  const going = useEvents({ attending: username }).data?.eventsCount ?? 0;

  return (
    <>
      <div
        className="h-[150px] rounded-[22px]"
        style={{ backgroundImage: BANNER }}
      />

      {/* avatar overlaps up into the banner; name sits beside it, actions right */}
      <div className="-mt-14 flex flex-wrap items-end gap-[22px] px-1.5">
        <div
          className="grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-[30px] border-4 border-background text-[2rem] font-bold uppercase text-background shadow-[0_10px_30px_-10px_rgba(0,0,0,0.7)] sm:h-32 sm:w-32"
          style={{ backgroundImage: AVATAR }}
        >
          {profile.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- user avatar, may be external
            <img
              src={profile.image}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            profile.username.slice(0, 2)
          )}
        </div>

        <div className="min-w-[160px] flex-1 translate-y-2">
          <h2 className="anton text-[clamp(1.9rem,4vw,2.6rem)] leading-[0.95]">
            {profile.username}
          </h2>
          <div className="mt-1.5 font-mono text-[0.82rem] text-muted-foreground">
            @{profile.username}
          </div>
        </div>

        <div className="flex shrink-0 items-end gap-2.5 pb-2">
          <FollowButton profile={profile} />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-6 px-1.5 text-[0.9rem] text-muted-foreground">
        <span>
          <b className="font-mono text-foreground">{hosting}</b> hosting
        </span>
        <span>
          <b className="font-mono text-foreground">{profile.followersCount}</b>{' '}
          followers
        </span>
        <span>
          <b className="font-mono text-foreground">{going}</b> going
        </span>
      </div>

      {profile.bio && (
        <p className="mt-3.5 max-w-[62ch] px-1.5 text-[1rem] leading-[1.6] text-foreground/85">
          {profile.bio}
        </p>
      )}
    </>
  );
}
