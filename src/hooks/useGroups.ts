import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createGroup,
  deleteGroup,
  fetchGroupWithMembers,
  fetchUserGroups,
  getGroupStreak,
  joinGroupByCode,
  leaveGroup,
  regenerateInviteCode,
  removeMember,
  updateGroup,
} from '@/services/groupService';
import { STALE_TIMES } from '@/services/queryClient';
import { ActivitySeed, UpdateGroupInput } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import {
  useGroupActivities as useGroupActivitiesImpl,
  useAddActivity,
  useArchiveActivity,
  useUnarchiveActivity,
  useUpdateActivity,
} from './useActivities';

/**
 * React Query hooks for groups, members & activities.
 * Activity hooks (useGroupActivities, useAddActivity, etc.) live in useActivities
 * and are re-exported here for convenience.
 */

export const GROUP_KEYS = {
  userGroups: ['groups', 'user'] as const,
  group: (groupId: string) => ['group', groupId] as const,
  groupMembers: (groupId: string) => ['group-members', groupId] as const,
  groupActivities: (groupId: string) => ['group-activities', groupId] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useUserGroups() {
  return useQuery({
    queryKey: GROUP_KEYS.userGroups,
    queryFn: fetchUserGroups,
    staleTime: STALE_TIMES.groups,
  });
}

export function useGroup(groupId: string) {
  return useQuery({
    queryKey: GROUP_KEYS.group(groupId),
    queryFn: () => fetchGroupWithMembers(groupId),
    enabled: groupId.length > 0,
    staleTime: STALE_TIMES.groups,
  });
}

export function useGroupMembers(groupId: string) {
  return useQuery({
    queryKey: GROUP_KEYS.groupMembers(groupId),
    queryFn: async () => (await fetchGroupWithMembers(groupId)).members,
    enabled: groupId.length > 0,
    staleTime: STALE_TIMES.groups,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, templates }: { input: Parameters<typeof createGroup>[0]; templates?: ActivitySeed[] }) =>
      createGroup(input, templates),
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.userGroups });
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.group(group.id) });
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.groupActivities(group.id) });
    },
  });
}

export function useJoinGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => joinGroupByCode(code),
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.userGroups });
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.group(group.id) });
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.groupMembers(group.id) });
    },
  });
}

export function useLeaveGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => leaveGroup(groupId),
    onSuccess: (_data, groupId) => {
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.userGroups });
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.group(groupId) });
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.groupMembers(groupId) });
    },
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, updates }: { groupId: string; updates: UpdateGroupInput }) =>
      updateGroup(groupId, updates),
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.userGroups });
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.group(group.id) });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      removeMember(groupId, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.group(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.groupMembers(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.userGroups });
    },
  });
}

export function useRegenerateInviteCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => regenerateInviteCode(groupId),
    onSuccess: (_code, groupId) => {
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.group(groupId) });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => deleteGroup(groupId),
    onSuccess: (_data, groupId) => {
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.userGroups });
      queryClient.removeQueries({ queryKey: GROUP_KEYS.group(groupId) });
      queryClient.removeQueries({ queryKey: GROUP_KEYS.groupMembers(groupId) });
      queryClient.removeQueries({ queryKey: GROUP_KEYS.groupActivities(groupId) });
    },
  });
}

// ─── Activity Hooks (re-exported from useActivities for convenience) ─────────

export const useGroupActivities = useGroupActivitiesImpl;
export { useAddActivity, useArchiveActivity, useUnarchiveActivity, useUpdateActivity };

// ─── Group Streak ────────────────────────────────────────────────────────────

/**
 * Read the current group streak (consecutive days with full participation).
 * Returns 0 if the group is empty or the calculation fails.
 */
export function useGroupStreak(groupId: string) {
  return useQuery({
    queryKey: ['group-streak', groupId],
    queryFn: () => getGroupStreak(groupId),
    enabled: groupId.length > 0,
    staleTime: 60 * 1000, // 1 minute — submissions can change it
  });
}

// ─── Leaderboard (members across all my groups) ──────────────────────────────

/**
 * Leaderboard entry — one user across one of my groups.
 */
export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  xp: number;
  level: number;
  longestStreak: number;
  groupId: string;
  groupName: string;
}

import { supabase as supabaseClient } from '@/services/supabase';

/**
 * Fetch every member of every group the user is in, then deduplicate by
 * user id (a user can be in multiple groups). Returned entries include
 * the user + their group name + their stats.
 */
export function useMyGroupMembers() {
  return useQuery({
    queryKey: ['my-group-members'],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const uid = useAuthStore.getState().session?.user?.id;
      if (!uid) return [];

      // 1) Get all group ids the user is in
      const { data: myMemberships, error: mErr } = await supabaseClient
        .from('group_members')
        .select('group_id, groups:groups(id, name)')
        .eq('user_id', uid);
      if (mErr) throw mErr;

      const groupIds = (myMemberships ?? []).map((m: any) => m.group_id);
      if (groupIds.length === 0) return [];

      // 2) Get all members of those groups, joined with users
      const { data: allMembers, error: aErr } = await supabaseClient
        .from('group_members')
        .select(`
          user_id,
          group_id,
          group:groups(id, name),
          user:users(*)
        `)
        .in('group_id', groupIds);
      if (aErr) throw aErr;

      // 3) Deduplicate by user_id (keep the first group encountered)
      const seen = new Set<string>();
      const entries: LeaderboardEntry[] = [];
      for (const m of (allMembers ?? []) as any[]) {
        if (!m.user || seen.has(m.user_id)) continue;
        seen.add(m.user_id);
        entries.push({
          userId: m.user_id,
          displayName: m.user.display_name ?? m.user.username ?? 'Member',
          username: m.user.username ?? 'member',
          avatarUrl: m.user.avatar_url ?? null,
          xp: m.user.xp ?? 0,
          level: m.user.level ?? 1,
          longestStreak: m.user.longest_streak ?? 0,
          groupId: m.group?.id ?? m.group_id,
          groupName: m.group?.name ?? 'Pact',
        });
      }
      return entries;
    },
    staleTime: STALE_TIMES.groups,
  });
}
