'use client';

import { useRouter } from 'next/navigation';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@events/api-client';
import type { CreateUserInput, LoginUserInput } from '@events/shared-types';

import { authKeys, currentUserQueryOptions } from '@/lib/auth/queries';
import { clearToken, getToken, setToken } from '@/lib/auth/token';

/**
 * Client auth hooks. The mutations only own data side-effects (token + cache);
 * navigation and 422→field mapping stay in the page so each concern is testable
 * on its own.
 */

/** Current user, or null when logged out. Reads the token from the cookie. */
export function useCurrentUser() {
  const token = getToken();
  return useQuery(currentUserQueryOptions(token));
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginUserInput) =>
      api.auth.login(input).then((res) => res.user),
    onSuccess: (user) => {
      setToken(user.token);
      // Seed the cache so the nav flips to "logged in" with no extra request.
      queryClient.setQueryData(authKeys.currentUser, user);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) =>
      api.auth.register(input).then((res) => res.user),
    onSuccess: (user) => {
      setToken(user.token);
      queryClient.setQueryData(authKeys.currentUser, user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return () => {
    clearToken();
    queryClient.setQueryData(authKeys.currentUser, null);
    queryClient.clear(); // drop any personalized cached data
    router.replace('/login');
    router.refresh(); // re-run Server Components so SSR'd content de-personalizes
  };
}
