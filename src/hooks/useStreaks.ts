import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES, QUERY_KEYS } from '@/services/queryClient';
import { Streak } from '@/types';
import {
  fetchUserStreaks,
  fetchStreak,
  declareRestDay,
  consumeStreakShield,
  fetchGroupMonthlyCalendar,
  fetchGroupStreakMembers,
  fetchComparativeDuel,
  fetchUserYearHeatmap,
} from '@/services/streakService';
import { StreakMember } from '@/components/ui/StreakSummaryBar';
import { DuelMember } from '@/components/ui/ComparativeView';

/**
 * React Query hooks for streaks, calendars, rest days, and shields.
 */

// ─── Query Hooks ─────────────────────────────────────────────────────────────

export function useUserStreaks(userId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.streaks(userId),
    queryFn: () => fetchUserStreaks(userId),
    enabled: Boolean(userId && userId.length > 0),
    staleTime: STALE_TIMES.calendar,
  });
}

export function useStreak(userId: string, activityId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.streak(userId, activityId),
    queryFn: () => fetchStreak(userId, activityId),
    enabled: Boolean(userId && userId.length > 0 && activityId && activityId.length > 0),
    staleTime: STALE_TIMES.calendar,
  });
}

export function useGroupMonthlyCalendar(groupId: string, year: number, month: number) {
  return useQuery({
    queryKey: ['group-calendar', groupId, year, month] as const,
    queryFn: () => fetchGroupMonthlyCalendar(groupId, year, month),
    enabled: Boolean(groupId && groupId.length > 0),
    staleTime: STALE_TIMES.calendar,
  });
}

export function useGroupStreakMembers(groupId: string) {
  return useQuery({
    queryKey: ['group-streak-members', groupId] as const,
    queryFn: () => fetchGroupStreakMembers(groupId),
    enabled: Boolean(groupId && groupId.length > 0),
    staleTime: STALE_TIMES.calendar,
  });
}

export function useComparativeDuel(member1Id: string, member2Id: string, groupId?: string) {
  return useQuery({
    queryKey: ['comparative-duel', member1Id, member2Id, groupId ?? 'all'] as const,
    queryFn: () => fetchComparativeDuel(member1Id, member2Id, groupId),
    enabled: Boolean(member1Id && member2Id),
    staleTime: STALE_TIMES.calendar,
  });
}

export function useUserYearHeatmap(userId: string) {
  return useQuery({
    queryKey: ['user-year-heatmap', userId] as const,
    queryFn: () => fetchUserYearHeatmap(userId),
    enabled: Boolean(userId && userId.length > 0),
    staleTime: STALE_TIMES.calendar,
  });
}

// ─── Mutation Hooks ──────────────────────────────────────────────────────────

export function useDeclareRestDay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ activityId, targetDate }: { activityId: string; targetDate?: string }) =>
      declareRestDay(activityId, targetDate),
    onSuccess: (updatedStreak) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.streaks(updatedStreak.userId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.streak(updatedStreak.userId, updatedStreak.activityId),
      });
      queryClient.invalidateQueries({ queryKey: ['group-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['group-streak-members'] });
    },
  });
}

export function useConsumeStreakShield() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ activityId, missedDate }: { activityId: string; missedDate: string }) =>
      consumeStreakShield(activityId, missedDate),
    onSuccess: (updatedStreak) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.streaks(updatedStreak.userId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.streak(updatedStreak.userId, updatedStreak.activityId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.currentUser,
      });
      queryClient.invalidateQueries({ queryKey: ['group-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['group-streak-members'] });
    },
  });
}
