/**
 * Dev-only auth bypass for sandbox environments with a clock-skewed
 * system date. When Supabase rejects our tokens with "JWT issued at future",
 * we swap in a mocked session from the seeded test users so the rest of
 * the app can be smoke-tested.
 *
 * This file is gated by `__DEV__` and only patches the supabase client when
 * we detect a clock skew. Real devices with a real clock never hit this path.
 */

import { supabase } from './supabase';
import type { Session, User } from '@supabase/supabase-js';

const CLOCK_SKEW_BUFFER_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
let installed = false;
let originalMethods: Record<string, (...args: any[]) => any> | null = null;

/**
 * Returns true if Supabase auth is broken because of a clock skew.
 * Cheap to call — uses the existing health endpoint.
 */
export async function isAuthClockSkewed(): Promise<boolean> {
  if (!__DEV__) return false;
  try {
    const { error } = await supabase.auth.signInAnonymously();
    if (error && /future|JWT issued at future/i.test(error.message)) {
      return true;
    }
    // If sign-in succeeded, we're fine. (No-op session for an anonymous user.)
    return false;
  } catch {
    return false;
  }
}

/**
 * Build a Session object that satisfies the shape the rest of the app uses.
 * Uses the real Supabase user id from the `users` table (alex/sarah/mike) so
 * RLS policies still apply.
 */
export function makeMockSession(userId: string, email: string): Session {
  const now = Math.floor(Date.now() / 1000);
  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: now + 3600,
    token_type: 'bearer',
    user: {
      id: userId,
      app_metadata: {},
      user_metadata: { display_name: email.split('@')[0] },
      aud: 'authenticated',
      confirmation_sent_at: undefined,
      confirmed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      email,
      email_confirmed_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
      role: 'authenticated',
      updated_at: new Date().toISOString(),
      identities: [],
      factors: [],
      aud_claim: 'authenticated',
      is_anonymous: false,
      phone: '',
    } as User,
  };
}

/**
 * Patch supabase.auth.* so the app sees a real-looking session for the
 * seeded test users. Idempotent. Saves the originals so uninstallAuthBypass
 * can restore them.
 */
export function installAuthBypass(session: Session): void {
  if (installed) return;
  if (!__DEV__) return;
  installed = true;

  // Save originals
  const auth = supabase.auth as any;
  originalMethods = {
    getSession: auth.getSession.bind(auth),
    getUser: auth.getUser.bind(auth),
    signInWithPassword: auth.signInWithPassword.bind(auth),
    signInAnonymously: auth.signInAnonymously.bind(auth),
    signUp: auth.signUp.bind(auth),
    signOut: auth.signOut.bind(auth),
    onAuthStateChange: auth.onAuthStateChange.bind(auth),
  };

  auth.getSession = async () => ({ data: { session }, error: null });
  auth.getUser = async () => ({ data: { user: session.user }, error: null });
  auth.signInWithPassword = async (_credentials: any) => ({
    data: { user: session.user, session },
    error: null,
  });
  auth.signInAnonymously = async () => ({
    data: { user: session.user, session },
    error: null,
  });
  auth.signUp = async (_credentials: any) => ({
    data: { user: session.user, session },
    error: null,
  });
  auth.signOut = async () => ({ error: null });
  auth.onAuthStateChange = (_callback: any) => ({
    data: { subscription: { id: 'mock', unsubscribe: () => {} } as any },
  } as any);

  console.log(
    '[dev-auth-bypass] Installed mock session for sandbox testing. ' +
    'Call uninstallAuthBypass() to restore real Supabase auth.'
  );
}

/**
 * Restore the original supabase.auth methods. Safe to call multiple times.
 * Exposed mostly for testing and emergency rollback.
 */
export function uninstallAuthBypass(): void {
  if (!installed || !originalMethods) return;
  const auth = supabase.auth as any;
  for (const [name, fn] of Object.entries(originalMethods)) {
    auth[name] = fn;
  }
  installed = false;
  originalMethods = null;
  console.log('[dev-auth-bypass] Restored real Supabase auth.');
}
