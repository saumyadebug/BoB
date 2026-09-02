import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { STALE_TIMES, QUERY_KEYS } from '@/services/queryClient';
import { Streak } from '@/types';
import { AppError } from '@/services/errors';

/**
 * React Query hooks for streaks.
 *
 * Streak rows are populated by the daily pg_cron job (Phase 6). For now,
 * we just read them. The first cron tick is "next phase" but the read path
 * works immediately once any data exists.
 */

function mapStreakRow(row: any): Streak {
  return {
    id: row.id,
    userId: row.user_id,
    activityId: row.activity_id,
    currentStreak: row.current_streak ?? 0,
    longestStreak: row.longest_streak ?? 0,
    lastSubmissionDate: row.last_submission_date ?? null,
    shieldUsedDates: row.shield_used_dates ?? [],
    restDayDates: row.rest_day_dates ?? [],
    updatedAt: row.updated_at,
  };
}

async function fetchUserStreaks(userId: string): Promise<Streak[]> {
  const { data, error } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .order('current_streak', { ascending: false });
  if (error) throw new AppError('NETWORK', 'Failed to load streaks');
  return ((data ?? []) as any[]).map(mapStreakRow);
}

async function fetchStreak(userId: string, activityId: string): Promise<Streak | null> {
  const { data, error } = await supabase
    .from('streaks')
    .select('*')
    .match({ user_id: userId, activity_id: activityId })
    .maybeSingle();
  if (error) throw new AppError('NETWORK', 'Failed to load streak');
  return data ? mapStreakRow(data) : null;
}

export function useUserStreaks(userId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.streaks(userId),
    queryFn: () => fetchUserStreaks(userId),
    enabled: userId.length > 0,
    staleTime: STALE_TIMES.calendar,
  });
}

export function useStreak(userId: string, activityId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.streak(userId, activityId),
    queryFn: () => fetchStreak(userId, activityId),
    enabled: userId.length > 0 && activityId.length > 0,
    staleTime: STALE_TIMES.calendar,
  });
}
