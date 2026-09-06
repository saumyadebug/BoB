import { supabase } from './supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { AppError } from './errors';
import {
  Submission,
  CreateSubmissionInput,
  UpdateSubmissionInput,
  User,
  Activity,
} from '@/types';
import { deleteSubmissionPhoto } from './storageService';
import {
  setFirestoreSubmission,
  updateFirestoreSubmission,
  deleteFirestoreSubmission,
} from './firebase';

const LOG_PREFIX = '[submissionService]';

// ─── Row Mappers ─────────────────────────────────────────────────────────────

export function mapSubmissionRow(row: Record<string, any>): Submission {
  return {
    id: row.id,
    userId: row.user_id,
    activityId: row.activity_id,
    groupId: row.group_id,
    photoUrl: row.photo_url ?? null,
    title: row.title ?? null,
    description: row.description ?? null,
    fieldValues: row.field_values ?? {},
    xpEarned: row.xp_earned ?? 0,
    clientTimestamp: row.client_timestamp,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    user: row.user ? {
      id: row.user.id,
      email: row.user.email,
      username: row.user.username,
      displayName: row.user.display_name,
      avatarUrl: row.user.avatar_url ?? null,
      xp: row.user.xp ?? 0,
      level: row.user.level ?? 1,
      shieldsAvailable: row.user.shields_available ?? 0,
      totalSubmissions: row.user.total_submissions ?? 0,
      longestStreak: row.user.longest_streak ?? 0,
      createdAt: row.user.created_at,
      updatedAt: row.user.updated_at,
    } : undefined,
    activity: row.activity ? {
      id: row.activity.id,
      groupId: row.activity.group_id,
      name: row.activity.name,
      icon: row.activity.icon,
      color: row.activity.color,
      templateKey: row.activity.template_key ?? null,
      frequency: row.activity.frequency,
      frequencyDays: row.activity.frequency_days ?? [],
      restDaysPerWeek: row.activity.rest_days_per_week ?? 0,
      requirePhoto: row.activity.require_photo ?? false,
      templateFields: row.activity.template_fields ?? [],
      isArchived: row.activity.is_archived ?? false,
      createdAt: row.activity.created_at,
      updatedAt: row.activity.updated_at,
    } : undefined,
  };
}

// ─── XP Calculation Helper ───────────────────────────────────────────────────

export function calculateSubmissionXp(
  photoUrl?: string | null,
  title?: string | null,
  description?: string | null,
  clientTimestamp?: string,
  currentStreak: number = 0
): number {
  let xp = 50; // Base XP for on-time submission

  if (photoUrl) {
    xp += 20; // Photo proof bonus
  }

  if (title?.trim() || description?.trim()) {
    xp += 10; // Context bonus
  }

  const date = clientTimestamp ? new Date(clientTimestamp) : new Date();
  const hour = date.getHours();

  if (hour < 12) {
    xp += 15; // Early bird bonus (before 12 PM)
  } else if (hour >= 22) {
    xp += 5; // Night owl bonus (after 10 PM)
  }

  // Streak Multiplier
  let multiplier = 1.0;
  if (currentStreak >= 30) {
    multiplier = 2.0;
  } else if (currentStreak >= 14) {
    multiplier = 1.5;
  } else if (currentStreak >= 7) {
    multiplier = 1.2;
  }

  return Math.round(xp * multiplier);
}

// ─── Current User Resolver ───────────────────────────────────────────────────

function requireCurrentUserId(): string {
  const storeUser = useAuthStore.getState().user;
  if (storeUser?.id) return storeUser.id;
  throw new AppError('NOT_AUTHENTICATED', 'You must be logged in to perform this action');
}

// ─── Submission CRUD ─────────────────────────────────────────────────────────

/**
 * Creates a new submission, updates streaks and XP, and mirrors to Firestore.
 */
export async function createSubmission(input: CreateSubmissionInput): Promise<Submission> {
  const userId = requireCurrentUserId();
  const clientTimestamp = input.clientTimestamp || new Date().toISOString();
  const submissionDate = clientTimestamp.slice(0, 10); // YYYY-MM-DD

  // 1. Fetch current streak for multiplier calculation
  const { data: streakData } = await supabase
    .from('streaks')
    .select('current_streak, longest_streak, last_submission_date, shield_used_dates, rest_day_dates')
    .match({ user_id: userId, activity_id: input.activityId })
    .maybeSingle();

  const currentStreak = streakData?.current_streak ?? 0;
  const xpEarned = calculateSubmissionXp(
    input.photoUrl,
    input.title,
    input.description,
    clientTimestamp,
    currentStreak
  );

  // 2. Insert into Supabase
  const insertPayload = {
    user_id: userId,
    activity_id: input.activityId,
    group_id: input.groupId,
    photo_url: input.photoUrl ?? null,
    title: input.title ? input.title.trim().slice(0, 80) : null,
    description: input.description ? input.description.trim().slice(0, 500) : null,
    field_values: input.fieldValues ?? {},
    xp_earned: xpEarned,
    client_timestamp: clientTimestamp,
  };

  const { data, error } = await supabase
    .from('submissions')
    .insert(insertPayload)
    .select(`
      *,
      user:users!submissions_user_id_fkey(*),
      activity:activities!submissions_activity_id_fkey(*)
    `)
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new AppError(
        'DUPLICATE_SUBMISSION',
        'You have already logged a submission for this activity today.'
      );
    }
    console.error(`${LOG_PREFIX} createSubmission failed:`, error);
    throw new AppError('NETWORK', error.message);
  }

  const submission = mapSubmissionRow(data);

  // 3. Atomically update user's XP and total submissions in background
  try {
    const { data: userData } = await supabase
      .from('users')
      .select('xp, total_submissions')
      .eq('id', userId)
      .single();

    if (userData) {
      await supabase
        .from('users')
        .update({
          xp: (userData.xp ?? 0) + xpEarned,
          total_submissions: (userData.total_submissions ?? 0) + 1,
        })
        .eq('id', userId);
    }
  } catch (userErr) {
    console.warn(`${LOG_PREFIX} Failed to update user XP:`, userErr);
  }

  // 4. Update streak record
  try {
    const lastDate = streakData?.last_submission_date;
    if (!lastDate || lastDate !== submissionDate) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      let newStreak = 1;

      if (lastDate === yesterday) {
        newStreak = (streakData?.current_streak ?? 0) + 1;
      } else if (streakData?.rest_day_dates?.includes(yesterday)) {
        // Rest day was taken yesterday, streak continues!
        newStreak = (streakData?.current_streak ?? 0) + 1;
      }

      const newLongest = Math.max(newStreak, streakData?.longest_streak ?? 0);

      // Award streak shield if hitting multiple of 7
      if (newStreak > 0 && newStreak % 7 === 0) {
        try {
          const { data: u } = await supabase
            .from('users')
            .select('shields_available')
            .eq('id', userId)
            .single();
          const curShields = u?.shields_available ?? 0;
          if (curShields < 3) {
            await supabase
              .from('users')
              .update({ shields_available: curShields + 1 })
              .eq('id', userId);
          }
        } catch {}
      }

      await supabase.from('streaks').upsert({
        user_id: userId,
        activity_id: input.activityId,
        current_streak: newStreak,
        longest_streak: newLongest,
        last_submission_date: submissionDate,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,activity_id' });
    }
  } catch (streakErr) {
    console.warn(`${LOG_PREFIX} Failed to update streak:`, streakErr);
  }

  // 5. Mirror submission to Firestore for instant real-time feed updates
  try {
    await setFirestoreSubmission(input.groupId, submission.id, {
      id: submission.id,
      userId: submission.userId,
      activityId: submission.activityId,
      groupId: submission.groupId,
      photoUrl: submission.photoUrl,
      title: submission.title,
      description: submission.description,
      fieldValues: submission.fieldValues,
      xpEarned: submission.xpEarned,
      clientTimestamp: submission.clientTimestamp,
      createdAt: submission.createdAt,
      reactionCounts: {},
      commentCount: 0,
      user: submission.user ? {
        displayName: submission.user.displayName,
        username: submission.user.username,
        avatarUrl: submission.user.avatarUrl,
        level: submission.user.level,
      } : null,
      activity: submission.activity ? {
        name: submission.activity.name,
        icon: submission.activity.icon,
        color: submission.activity.color,
      } : null,
    });
  } catch (mirrorErr) {
    console.warn(`${LOG_PREFIX} Firestore mirror failed:`, mirrorErr);
  }

  return submission;
}

/**
 * Updates an existing submission (title, description, fieldValues only).
 * Enforces the 1-hour edit window rule.
 */
export async function updateSubmission(
  submissionId: string,
  input: UpdateSubmissionInput
): Promise<Submission> {
  const userId = requireCurrentUserId();

  // 1. Fetch submission to verify ownership and 1-hour window
  const { data: existing, error: fetchErr } = await supabase
    .from('submissions')
    .select('id, user_id, group_id, created_at')
    .eq('id', submissionId)
    .single();

  if (fetchErr || !existing) {
    throw new AppError('NOT_FOUND', 'Submission not found');
  }

  if (existing.user_id !== userId) {
    throw new AppError('NOT_ALLOWED', 'You can only edit your own submissions');
  }

  const createdAtMs = new Date(existing.created_at).getTime();
  const oneHourMs = 60 * 60 * 1000;
  if (Date.now() - createdAtMs > oneHourMs) {
    throw new AppError(
      'NOT_ALLOWED',
      'Submissions can only be edited within 1 hour of posting'
    );
  }

  // 2. Perform update
  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };
  if (input.title !== undefined) updates.title = input.title ? input.title.trim().slice(0, 80) : null;
  if (input.description !== undefined) updates.description = input.description ? input.description.trim().slice(0, 500) : null;
  if (input.fieldValues !== undefined) updates.field_values = input.fieldValues;

  const { data, error } = await supabase
    .from('submissions')
    .update(updates)
    .eq('id', submissionId)
    .select(`
      *,
      user:users!submissions_user_id_fkey(*),
      activity:activities!submissions_activity_id_fkey(*)
    `)
    .single();

  if (error) {
    throw new AppError('NETWORK', error.message);
  }

  const updated = mapSubmissionRow(data);

  // 3. Mirror update to Firestore
  try {
    await updateFirestoreSubmission(existing.group_id, submissionId, {
      title: updated.title,
      description: updated.description,
      fieldValues: updated.fieldValues,
      updatedAt: updated.updatedAt,
    });
  } catch (mirrorErr) {
    console.warn(`${LOG_PREFIX} Firestore update mirror failed:`, mirrorErr);
  }

  return updated;
}

/**
 * Deletes a submission within 24 hours.
 * Cleans up photo proof from storage and mirrors deletion to Firestore.
 */
export async function deleteSubmission(submissionId: string): Promise<void> {
  const userId = requireCurrentUserId();

  // 1. Verify ownership & 24-hour window
  const { data: existing, error: fetchErr } = await supabase
    .from('submissions')
    .select('id, user_id, group_id, photo_url, xp_earned, created_at')
    .eq('id', submissionId)
    .single();

  if (fetchErr || !existing) {
    throw new AppError('NOT_FOUND', 'Submission not found');
  }

  if (existing.user_id !== userId) {
    throw new AppError('NOT_ALLOWED', 'You can only delete your own submissions');
  }

  const createdAtMs = new Date(existing.created_at).getTime();
  const twentyFourHoursMs = 24 * 60 * 60 * 1000;
  if (Date.now() - createdAtMs > twentyFourHoursMs) {
    throw new AppError(
      'NOT_ALLOWED',
      'Submissions can only be deleted within 24 hours of posting'
    );
  }

  // 2. Delete from Supabase
  const { error } = await supabase
    .from('submissions')
    .delete()
    .eq('id', submissionId);

  if (error) {
    throw new AppError('NETWORK', error.message);
  }

  // 3. Clean up photo from Storage if present
  if (existing.photo_url) {
    deleteSubmissionPhoto(existing.photo_url).catch((err) => {
      console.warn(`${LOG_PREFIX} Failed to delete storage photo:`, err);
    });
  }

  // 4. Mirror delete to Firestore
  try {
    await deleteFirestoreSubmission(existing.group_id, submissionId);
  } catch (mirrorErr) {
    console.warn(`${LOG_PREFIX} Firestore delete mirror failed:`, mirrorErr);
  }

  // 5. Deduct XP from user record
  try {
    const { data: u } = await supabase
      .from('users')
      .select('xp, total_submissions')
      .eq('id', userId)
      .single();
    if (u) {
      await supabase
        .from('users')
        .update({
          xp: Math.max(0, (u.xp ?? 0) - (existing.xp_earned ?? 0)),
          total_submissions: Math.max(0, (u.total_submissions ?? 0) - 1),
        })
        .eq('id', userId);
    }
  } catch (xpErr) {
    console.warn(`${LOG_PREFIX} Failed to adjust user XP on delete:`, xpErr);
  }
}

/**
 * Fetch group submissions feed from Supabase.
 */
export async function fetchGroupSubmissions(
  groupId: string,
  limitCount: number = 20
): Promise<Submission[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select(`
      *,
      user:users!submissions_user_id_fkey(*),
      activity:activities!submissions_activity_id_fkey(*)
    `)
    .eq('group_id', groupId)
    .order('client_timestamp', { ascending: false })
    .limit(limitCount);

  if (error) throw new AppError('NETWORK', error.message);
  return ((data ?? []) as any[]).map(mapSubmissionRow);
}

/**
 * Fetch a user's submissions history across all groups.
 */
export async function fetchUserSubmissions(
  userId: string,
  limitCount: number = 50
): Promise<Submission[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select(`
      *,
      user:users!submissions_user_id_fkey(*),
      activity:activities!submissions_activity_id_fkey(*)
    `)
    .eq('user_id', userId)
    .order('client_timestamp', { ascending: false })
    .limit(limitCount);

  if (error) throw new AppError('NETWORK', error.message);
  return ((data ?? []) as any[]).map(mapSubmissionRow);
}

/**
 * Fetch submissions for a specific activity in a group.
 */
export async function fetchActivitySubmissions(
  activityId: string,
  limitCount: number = 30
): Promise<Submission[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select(`
      *,
      user:users!submissions_user_id_fkey(*),
      activity:activities!submissions_activity_id_fkey(*)
    `)
    .eq('activity_id', activityId)
    .order('client_timestamp', { ascending: false })
    .limit(limitCount);

  if (error) throw new AppError('NETWORK', error.message);
  return ((data ?? []) as any[]).map(mapSubmissionRow);
}

/**
 * Fetch a single submission by its ID.
 */
export async function getSubmissionById(submissionId: string): Promise<Submission | null> {
  const { data, error } = await supabase
    .from('submissions')
    .select(`
      *,
      user:users!submissions_user_id_fkey(*),
      activity:activities!submissions_activity_id_fkey(*)
    `)
    .eq('id', submissionId)
    .maybeSingle();

  if (error) throw new AppError('NETWORK', error.message);
  return data ? mapSubmissionRow(data) : null;
}
