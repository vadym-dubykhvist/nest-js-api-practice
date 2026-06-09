'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { UserCheck, UserPlus } from 'lucide-react';

import type { Profile } from '@events/shared-types';

import { useCurrentUser } from '@/lib/auth/hooks';
import { withNext } from '@/lib/auth/redirect';
import { useToggleFollow } from '@/lib/profile/hooks';

export function FollowButton({ profile }: { profile: Profile }) {
  const { data: user } = useCurrentUser();
  const pathname = usePathname();
  const toggle = useToggleFollow(profile.username);

  // Own profile: nothing to follow (edit/settings is a separate, future page).
  if (user?.username === profile.username) return null;

  // Logged out: send them to login, then back here to follow.
  if (!user) {
    return (
      <Link href={withNext('/login', pathname)} className="btn btn-acid">
        <UserPlus width={16} height={16} />
        Follow
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggle.mutate(profile.following)}
      disabled={toggle.isPending}
      className={`btn ${profile.following ? 'btn-outline' : 'btn-acid'} disabled:opacity-50`}
    >
      {profile.following ? (
        <>
          <UserCheck width={16} height={16} />
          Following
        </>
      ) : (
        <>
          <UserPlus width={16} height={16} />
          Follow
        </>
      )}
    </button>
  );
}
