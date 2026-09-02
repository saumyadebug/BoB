import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { STALE_TIMES, QUERY_KEYS } from '@/services/queryClient';
import { useAuthStore } from '@/store/useAuthStore';
import { AppError } from '@/services/errors';
import { User } from '@/types';

/**
 * Hooks for the authenticated user's profile row (public.users).
 *
 * The session is the source of truth for "am I signed in?" (managed by
 * useAuthSync). The user profile is a separate concept — populated lazily
 * by these hooks. Screens that need the profile should call useCurrentUser
 * and read `data` directly, not poke the store.
 *
 * Hooks:
 *   - useCurrentUser()          — the current authenticated user's profile
 *   - useUpdateProfile()        — mutation to update name/username/avatar
 *   - useUsernameAvailability() — username uniqueness check (debounced)
 *   - fetchCurrentUserOnce()    — one-shot fetcher (Splash / post-signup)
 */

export function useCurrentUser() {
  const session = useAuthStore((s) => s.session);

  return useQuery({
    queryKey: [...QUERY_KEYS.currentUser, session?.user?.id ?? 'anon'] as const,
    queryFn: async (): Promise<User | null> => {
      if (!session?.user?.id) return null;
      return userService.fetchCurrentUser();
    },
    enabled: !!session?.user?.id,
    staleTime: STALE_TIMES.profile,
    // Don't retry on auth errors — there's no point retrying a "not signed in" error.
    retry: (count, err) => {
      if (err instanceof AppError && err.code === 'NOT_AUTHENTICATED') return false;
      return count < 2;
    },
  });
}

/** One-shot fetcher. Use in Splash / after sign-up before useCurrentUser's effect runs. */
export async function fetchCurrentUserOnce(): Promise<User | null> {
  return userService.fetchCurrentUser();
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: Partial<{ username: string; displayName: string; avatarUrl: string | null }>) =>
      userService.updateCurrentUserProfile(updates),
    onSuccess: (user) => {
      queryClient.setQueryData(QUERY_KEYS.currentUser, user);
    },
  });
}

/**
 * Username availability check. Internally debounced so callers don't have
 * to manage timers. After `debounceMs` of inactivity, the hook fires a
 * single query and caches the result. Returns null while debouncing or
 * while the query is loading.
 */
export function useUsernameAvailability(username: string, debounceMs: number = 400) {
  const [debounced, setDebounced] = useState(username);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(username), debounceMs);
    return () => clearTimeout(handle);
  }, [username, debounceMs]);

  return useQuery({
    queryKey: ['username-available', debounced.toLowerCase()] as const,
    queryFn: async (): Promise<boolean> => {
      if (!debounced || debounced.length < 3) return false;
      return userService.isUsernameAvailable(debounced);
    },
    enabled: debounced.length >= 3,
    staleTime: 30 * 1000,
  });
}
