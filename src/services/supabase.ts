import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ENV from './env';

/**
 * Supabase client — Primary database & storage.
 *
 * - Handles relational data: users, groups, activities, submissions, streaks, badges
 * - Handles file storage: submission photos (bucket: 'submission-photos')
 * - Authentication: email/password + Google OAuth (handled by Supabase Auth, not Firebase)
 * - Row-Level Security (RLS) policies enforce data access rules server-side
 */

const supabaseUrl = ENV.SUPABASE_URL || '';
const supabaseAnonKey = ENV.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'All data calls will fail until .env is configured.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Mobile app — no URL-based OAuth
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// ─── Storage Helpers ──────────────────────────────────────────────────────────

export const SUBMISSION_PHOTOS_BUCKET = 'submission-photos';
export const AVATARS_BUCKET = 'avatars';

/**
 * Upload a submission photo and return its public URL.
 */
export async function uploadSubmissionPhoto(
  userId: string,
  activityId: string,
  uri: string,
  mimeType: string = 'image/jpeg'
): Promise<string | null> {
  const ext = mimeType === 'image/png' ? 'png' : 'jpg';
  const path = `${userId}/${activityId}/${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from(SUBMISSION_PHOTOS_BUCKET)
    .upload(path, {
      uri,
      type: mimeType,
      name: `submission.${ext}`,
    } as any, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    console.error('[Supabase Storage] Submission upload failed:', error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from(SUBMISSION_PHOTOS_BUCKET)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

/**
 * Upload a user avatar and return its public URL.
 */
export async function uploadAvatar(
  userId: string,
  uri: string,
  mimeType: string = 'image/jpeg'
): Promise<string | null> {
  const ext = mimeType === 'image/png' ? 'png' : 'jpg';
  const path = `${userId}/avatar.${ext}`;

  const { data, error } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(path, {
      uri,
      type: mimeType,
      name: `avatar.${ext}`,
    } as any, {
      contentType: mimeType,
      upsert: true, // overwrite previous avatar
    });

  if (error) {
    console.error('[Supabase Storage] Avatar upload failed:', error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from(AVATARS_BUCKET)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

export default supabase;
