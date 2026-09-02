import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { AppError, isAppError } from '@/services/errors';
import { User } from '@/types';

/**
 * User service — profile provisioning & lookup against the Supabase `users`
 * table, keyed by `auth.uid()` (the current Supabase session's user id).
 */

const LOG_PREFIX = '[userService]';

export interface EnsureUserProfile {
  username: string;
  displayName?: string;
  avatarUrl?: string | null;
}

// ─── Row Mapper (snake_case DB → camelCase app type) ─────────────────────────

function mapUserRow(row: Record<string, any>): User {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url ?? null,
    xp: row.xp ?? 0,
    level: row.level ?? 1,
    totalSubmissions: row.total_submissions ?? 0,
    longestStreak: row.longest_streak ?? 0,
    shieldsAvailable: row.shields_available ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getCurrentUserId(): string {
  const uid = useAuthStore.getState().session?.user?.id;
  if (!uid) throw new AppError('NOT_AUTHENTICATED', 'No active session');
  return uid;
}

function getCurrentEmail(): string {
  return useAuthStore.getState().session?.user?.email ?? '';
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Upsert the authenticated user's profile row in the `users` table.
 * Called after sign-up, on profile setup, and any time profile fields change.
 *
 * The `id` column is the Supabase auth user id (UUID). Email comes from the
 * session so we never have to ask the user to re-type it.
 */
export async function ensureCurrentUser(profile: EnsureUserProfile): Promise<User> {
  try {
    const uid = getCurrentUserId();
    const email = getCurrentEmail();

    if (!email) {
      throw new AppError('NOT_AUTHENTICATED', 'No email on current session');
    }

    const { data, error } = await supabase
      .from('users')
      .upsert(
        {
          id: uid,
          email,
          username: profile.username,
          display_name: profile.displayName || profile.username,
          avatar_url: profile.avatarUrl ?? null,
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) throw error;
    return mapUserRow(data);
  } catch (error) {
    console.error(`${LOG_PREFIX} ensureCurrentUser:`, error);
    throw isAppError(error) ? error : new AppError('NETWORK', 'Failed to save profile');
  }
}

/**
 * Fetch the current authenticated user's profile row.
 * Returns null if the row doesn't exist yet (user signed in but hasn't completed setup).
 */
export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const uid = getCurrentUserId();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', uid)
      .maybeSingle();

    if (error) throw error;
    return data ? mapUserRow(data) : null;
  } catch (error) {
    console.error(`${LOG_PREFIX} fetchCurrentUser:`, error);
    throw isAppError(error) ? error : new AppError('NETWORK', 'Failed to load user');
  }
}

export async function getUserById(id: string): Promise<User> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new AppError('NOT_FOUND', `User ${id} not found`);
    return mapUserRow(data);
  } catch (error) {
    console.error(`${LOG_PREFIX} getUserById:`, error);
    throw isAppError(error) ? error : new AppError('NETWORK', 'Failed to load user');
  }
}

/**
 * Check whether a username is available (case-insensitive, debounced caller-side).
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .ilike('username', username)
      .maybeSingle();

    if (error) throw error;
    return data === null;
  } catch (error) {
    console.error(`${LOG_PREFIX} isUsernameAvailable:`, error);
    throw isAppError(error) ? error : new AppError('NETWORK', 'Username check failed');
  }
}

/**
 * Update the current user's profile fields.
 */
export async function updateCurrentUserProfile(updates: Partial<{
  username: string;
  displayName: string;
  avatarUrl: string | null;
}>): Promise<User> {
  try {
    const uid = getCurrentUserId();
    const payload: Record<string, any> = {};
    if (updates.username !== undefined) payload.username = updates.username;
    if (updates.displayName !== undefined) payload.display_name = updates.displayName;
    if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl;

    const { data, error } = await supabase
      .from('users')
      .update(payload)
      .eq('id', uid)
      .select()
      .single();

    if (error) throw error;
    return mapUserRow(data);
  } catch (error) {
    console.error(`${LOG_PREFIX} updateCurrentUserProfile:`, error);
    throw isAppError(error) ? error : new AppError('NETWORK', 'Failed to update profile');
  }
}

export const userService = {
  ensureCurrentUser,
  fetchCurrentUser,
  getUserById,
  isUsernameAvailable,
  updateCurrentUserProfile,
};
