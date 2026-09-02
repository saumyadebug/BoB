import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { STALE_TIMES, QUERY_KEYS } from '@/services/queryClient';
import { Submission } from '@/types';
import { AppError } from '@/services/errors';

/**
 * React Query hooks for submissions.
 *
 * Phase 5+ will add the create-submission flow, but reading submissions
 * is needed now (the home feed in Phase 3+, the calendar in Phase 6).
 *
 * What this gives us now:
 *   - useGroupSubmissions: feed for a single group, paginated, ordered desc
 *   - useUserSubmissions: all submissions by a user (profile / history)
 *   - useUserActivitySubmissions: submissions for a specific activity
 *     (used by the Activity Detail "submissions history" tab)
 */

function mapSubmissionRow(row: any): Submission {
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
      totalSubmissions: row.user.total_submissions ?? 0,
      longestStreak: row.user.longest_streak ?? 0,
      shieldsAvailable: row.user.shields_available ?? 0,
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

async function fetchGroupSubmissions(groupId: string, limit: number = 20): Promise<Submission[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select(`
      *,
      user:users(*),
      activity:activities(*)
    `)
    .eq('group_id', groupId)
    .order('client_timestamp', { ascending: false })
    .limit(limit);
  if (error) throw new AppError('NETWORK', 'Failed to load submissions');
  return ((data ?? []) as any[]).map(mapSubmissionRow);
}

async function fetchUserSubmissions(userId: string, activityId?: string, limit: number = 50): Promise<Submission[]> {
  let query = supabase
    .from('submissions')
    .select(`
      *,
      user:users(*),
      activity:activities(*)
    `)
    .eq('user_id', userId)
    .order('client_timestamp', { ascending: false })
    .limit(limit);
  if (activityId) query = query.eq('activity_id', activityId);
  const { data, error } = await query;
  if (error) throw new AppError('NETWORK', 'Failed to load submissions');
  return ((data ?? []) as any[]).map(mapSubmissionRow);
}

export function useGroupSubmissions(groupId: string, limit: number = 20) {
  return useQuery({
    queryKey: [...QUERY_KEYS.submissions(groupId, 'group'), limit] as const,
    queryFn: () => fetchGroupSubmissions(groupId, limit),
    enabled: groupId.length > 0,
    staleTime: STALE_TIMES.feed,
  });
}

/**
 * Fetch every submission in the given groups, ordered by client_timestamp desc.
 * Used for the home feed (aggregates across all the user's groups).
 */
export function useFeedSubmissions(groupIds: string[], limit: number = 50) {
  return useQuery({
    queryKey: ['feed-submissions', groupIds.slice().sort().join(','), limit] as const,
    enabled: groupIds.length > 0,
    queryFn: async (): Promise<Submission[]> => {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          user:users(*),
          activity:activities(*)
        `)
        .in('group_id', groupIds)
        .order('client_timestamp', { ascending: false })
        .limit(limit);
      if (error) throw new AppError('NETWORK', 'Failed to load feed');
      return ((data ?? []) as any[]).map(mapSubmissionRow);
    },
    staleTime: STALE_TIMES.feed,
  });
}

export function useUserSubmissions(userId: string, activityId?: string, limit: number = 50) {
  return useQuery({
    queryKey: [...QUERY_KEYS.submissions(userId, activityId), limit] as const,
    queryFn: () => fetchUserSubmissions(userId, activityId, limit),
    enabled: userId.length > 0,
    staleTime: STALE_TIMES.feed,
  });
}

export function useUserActivitySubmissions(userId: string, activityId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.submissions(userId, activityId),
    queryFn: () => fetchUserSubmissions(userId, activityId, 100),
    enabled: userId.length > 0 && activityId.length > 0,
    staleTime: STALE_TIMES.calendar,
  });
}
