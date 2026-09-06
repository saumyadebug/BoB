import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { storage } from '@/utils/storage';

/**
 * useAuthSync - single source of truth for the Supabase session.
 *
 * Mounted once at the app root. Subscribes to supabase.auth.onAuthStateChange
 * and writes the session into the Zustand store. Also keeps the JWT in
 * SecureStore (via storage) in sync with the live session.
 *
 * CRITICAL invariant: only this hook writes `session` to the store. The
 * `useCurrentUser` hook writes the *user profile* (not the session). The
 * two are separate concerns:
 *   - session:  who is authenticated right now (auth layer)
 *   - user:     the profile row from public.users (data layer)
 *
 * The `user` field is populated lazily by `useCurrentUser` after the session
 * is set. Screens should read `session` to know "am I logged in?" and
 * `user` to know "what's my display name?".
 *
 * Bonus: when the app comes back to the foreground, we re-validate the
 * session by calling getSession() - this catches token refresh + expiry
 * that would otherwise only show up on the next API call.
 */
export function useAuthSync(): void {
  const setSession = useAuthStore((s) => s.setSession);
  const setLoading = useAuthStore((s) => s.setLoading);

  // Guard against re-entrancy from rapid foreground events.
  const inflight = useRef(false);

  useEffect(() => {
    let mounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    const persist = async (accessToken: string | null) => {
      if (accessToken) {
        await storage.setItem('streakpact_jwt', accessToken);
      } else {
        await storage.removeItem('streakpact_jwt');
      }
    };

    const syncUser = async (session: any) => {
      if (!session?.user?.id) {
        useAuthStore.getState().setUser(null);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error && (error.code === 'PGRST303' || /future/i.test(error.message))) {
          console.warn('[useAuthSync] Clock skew detected (PGRST303). Resetting session.');
          await supabase.auth.signOut();
          return;
        }

        if (data && mounted) {
          useAuthStore.getState().setUser({
            id: data.id,
            email: data.email,
            username: data.username,
            displayName: data.display_name,
            avatarUrl: data.avatar_url ?? null,
            xp: data.xp ?? 0,
            level: data.level ?? 1,
            totalSubmissions: data.total_submissions ?? 0,
            longestStreak: data.longest_streak ?? 0,
            shieldsAvailable: data.shields_available ?? 0,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          });
        } else if (mounted) {
          useAuthStore.getState().setUser({
            id: session.user.id,
            email: session.user.email ?? '',
            username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'user',
            displayName: session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'User',
            avatarUrl: session.user.user_metadata?.avatar_url ?? null,
            xp: 0,
            level: 1,
            totalSubmissions: 0,
            longestStreak: 0,
            shieldsAvailable: 1,
            createdAt: session.user.created_at || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn('[useAuthSync] Profile fetch error:', err);
      }
    };

    const refreshSession = async () => {
      if (inflight.current) return;
      inflight.current = true;
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(data.session);
        await persist(data.session?.access_token ?? null);
        await syncUser(data.session);
      } catch (err) {
        console.warn('[useAuthSync] getSession failed:', err);
      } finally {
        if (mounted) setLoading(false);
        inflight.current = false;
      }
    };

    const init = async () => {
      // 1) Initial session check
      await refreshSession();

      // 2) Subscribe to future changes (sign-in, sign-out, token refresh)
      const sub = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;
        setSession(session);
        await persist(session?.access_token ?? null);
        await syncUser(session);
      });
      subscription = sub.data.subscription;
    };

    init();

    // 3) Re-validate on foreground (catches silent token expiry)
    const onAppStateChange = (state: AppStateStatus) => {
      if (state === 'active') refreshSession();
    };
    const appStateSub = AppState.addEventListener('change', onAppStateChange);

    return () => {
      mounted = false;
      subscription?.unsubscribe();
      appStateSub.remove();
    };
  }, [setSession, setLoading]);
}
