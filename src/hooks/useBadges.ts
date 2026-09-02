import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { STALE_TIMES, QUERY_KEYS } from '@/services/queryClient';
import { BadgeDefinition, UserBadge } from '@/types';
import { AppError } from '@/services/errors';

/**
 * React Query hooks for badges.
 *
 * `badges` table is public-read (seeded in schema.sql). `user_badges` is
 * user-scoped via RLS. Awarding badges happens via Edge Function (Phase 8).
 */

function mapBadgeRow(row: any): BadgeDefinition {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    icon: row.icon,
    category: row.category,
    condition: row.condition ?? {},
  };
}

function mapUserBadgeRow(row: any): UserBadge {
  return {
    id: row.id,
    userId: row.user_id,
    badgeId: row.badge_id,
    earnedAt: row.earned_at,
    badge: row.badge ? mapBadgeRow(row.badge) : undefined,
  };
}

export function useAllBadges() {
  return useQuery({
    queryKey: QUERY_KEYS.badges,
    queryFn: async (): Promise<BadgeDefinition[]> => {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('category', { ascending: true });
      if (error) throw new AppError('NETWORK', 'Failed to load badges');
      return ((data ?? []) as any[]).map(mapBadgeRow);
    },
    staleTime: STALE_TIMES.badges,
  });
}

export function useUserBadges(userId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.userBadges(userId),
    queryFn: async (): Promise<UserBadge[]> => {
      const { data, error } = await supabase
        .from('user_badges')
        .select('*, badge:badges(*)')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });
      if (error) throw new AppError('NETWORK', 'Failed to load user badges');
      return ((data ?? []) as any[]).map(mapUserBadgeRow);
    },
    enabled: userId.length > 0,
    staleTime: STALE_TIMES.badges,
  });
}
