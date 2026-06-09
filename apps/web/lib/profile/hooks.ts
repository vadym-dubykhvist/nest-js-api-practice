'use client';

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
  type UseSuspenseQueryResult,
} from '@tanstack/react-query';

import { api } from '@events/api-client';
import type { ProfileResponse } from '@events/shared-types';

import { getToken } from '@/lib/auth/token';
import { profileKeys, profileQueryOptions } from '@/lib/profile/queries';

export function useProfileSuspense(
  username: string,
): UseSuspenseQueryResult<ProfileResponse, Error> {
  // Token from the cookie so `following` matches what the server prefetched.
  return useSuspenseQuery(profileQueryOptions(username, getToken()));
}

/**
 * Follow / unfollow toggle. Optimistic: flips `following` on the cached profile
 * immediately, rolls back on error, reconciles on settle. Pass the CURRENT
 * following state so the mutation picks follow vs unfollow.
 */
export function useToggleFollow(username: string) {
  const queryClient = useQueryClient();
  const key = profileKeys.detail(username);

  return useMutation({
    mutationFn: (following: boolean) => {
      const opts = { token: getToken() ?? undefined };
      return following
        ? api.profiles.unfollow(username, opts)
        : api.profiles.follow(username, opts);
    },
    onMutate: async (following) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ProfileResponse>(key);
      queryClient.setQueryData<ProfileResponse>(key, (old) =>
        old
          ? {
              profile: {
                ...old.profile,
                following: !following,
                followersCount:
                  old.profile.followersCount + (following ? -1 : 1),
              },
            }
          : old,
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}
