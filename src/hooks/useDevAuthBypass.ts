import { useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { isAuthClockSkewed, installAuthBypass, makeMockSession } from '@/services/devAuthBypass';

/**
 * Dev-only auth bypass hook.
 *
 * Probes Supabase auth on mount. If the response says "JWT issued at future",
 * that means the local clock is ahead of Supabase's clock — a sandbox
 * artifact, not a production issue. We install a mock session so the rest of
 * the app can be smoke-tested end-to-end.
 *
 * On a real device with a correct clock, the probe succeeds, this is
 * a no-op, and real Supabase auth runs as expected.
 */
export function useDevAuthBypass(): void {
  useEffect(() => {
    if (!__DEV__) return;
    let cancelled = false;

    (async () => {
      const skewed = await isAuthClockSkewed();
      if (cancelled) return;
      if (!skewed) return;

      // Look up Alex's user id from the public.users table using the anon
      // key (RLS allows reading all users since the policy is "USING (TRUE)").
      const { data: users } = await supabase
        .from('users')
        .select('id, email')
        .eq('username', 'alex')
        .maybeSingle();
      if (cancelled) return;
      if (!users) {
        console.warn('[dev-auth-bypass] No alex user in DB. Run seed-dev first.');
        return;
      }
      const session = makeMockSession(users.id, users.email);
      installAuthBypass(session);
      useAuthStore.getState().setSession(session);
    })();

    return () => { cancelled = true; };
  }, []);
}
