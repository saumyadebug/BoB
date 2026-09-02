import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { STALE_TIMES, QUERY_KEYS } from '@/services/queryClient';
import { Activity, AddActivityInput } from '@/types';
import { AppError } from '@/services/errors';

/**
 * React Query hooks for activities.
 *
 * Reads come from the `activities` table scoped to a group. Writes go
 * through `addActivity` (admin) and `archiveActivity` (admin soft-deletes).
 * `updateActivity` is added in Phase 4.1.
 */

// ─── Mappers ────────────────────────────────────────────────────────────────

function mapActivityRow(row: any): Activity {
  return {
    id: row.id,
    groupId: row.group_id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    templateKey: row.template_key ?? null,
    frequency: row.frequency,
    frequencyDays: row.frequency_days ?? [],
    restDaysPerWeek: row.rest_days_per_week ?? 0,
    requirePhoto: row.require_photo ?? false,
    templateFields: row.template_fields ?? [],
    isArchived: row.is_archived ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── Queries ────────────────────────────────────────────────────────────────

async function fetchGroupActivities(groupId: string, unarchivedOnly: boolean = true): Promise<Activity[]> {
  let query = supabase
    .from('activities')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true });
  if (unarchivedOnly) query = query.eq('is_archived', false);
  const { data, error } = await query;
  if (error) throw new AppError('NETWORK', 'Failed to load activities');
  return ((data ?? []) as any[]).map(mapActivityRow);
}

export function useGroupActivities(groupId: string, unarchivedOnly: boolean = true) {
  return useQuery({
    queryKey: [...QUERY_KEYS.activities(groupId), unarchivedOnly ? 'active' : 'all'] as const,
    queryFn: () => fetchGroupActivities(groupId, unarchivedOnly),
    enabled: groupId.length > 0,
    staleTime: STALE_TIMES.groups,
  });
}

export function useActivity(activityId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.activity(activityId),
    queryFn: async (): Promise<Activity | null> => {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('id', activityId)
        .maybeSingle();
      if (error) throw new AppError('NETWORK', 'Failed to load activity');
      return data ? mapActivityRow(data) : null;
    },
    enabled: activityId.length > 0,
    staleTime: STALE_TIMES.groups,
  });
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export function useAddActivity(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddActivityInput): Promise<Activity> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new AppError('NOT_AUTHENTICATED', 'Not signed in');

      const { data, error } = await supabase
        .from('activities')
        .insert({
          group_id: groupId,
          name: input.name,
          icon: input.icon,
          color: input.color,
          frequency: input.frequency ?? 'daily',
          frequency_days: input.frequencyDays ?? [0, 1, 2, 3, 4, 5, 6],
          require_photo: input.requirePhoto ?? false,
          template_key: input.templateKey ?? null,
          template_fields: input.templateFields ?? [],
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw new AppError('NETWORK', 'Failed to create activity');
      return mapActivityRow(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activities(groupId) });
    },
  });
}

export function useArchiveActivity(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (activityId: string): Promise<void> => {
      const { error } = await supabase
        .from('activities')
        .update({ is_archived: true })
        .eq('id', activityId);
      if (error) throw new AppError('NETWORK', 'Failed to archive activity');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activities(groupId) });
    },
  });
}

export function useUnarchiveActivity(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (activityId: string): Promise<void> => {
      const { error } = await supabase
        .from('activities')
        .update({ is_archived: false })
        .eq('id', activityId);
      if (error) throw new AppError('NETWORK', 'Failed to unarchive activity');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activities(groupId) });
    },
  });
}

/**
 * Update an existing activity (admin only). Added in Phase 4.1.
 * Renames, color change, rest days, frequency — anything except group_id.
 */
/**
 * Fetch all activities across the given groups, grouped by groupId.
 * Returns a Map for O(1) lookups from the card renderer.
 */
export function useAllGroupActivities(groupIds: string[], unarchivedOnly: boolean = true) {
  return useQuery({
    queryKey: [
      'all-group-activities',
      groupIds.slice().sort().join(','),
      unarchivedOnly ? 'active' : 'all',
    ] as const,
    enabled: groupIds.length > 0,
    queryFn: async (): Promise<Record<string, Activity[]>> => {
      let query = supabase
        .from('activities')
        .select('*')
        .in('group_id', groupIds)
        .order('created_at', { ascending: true });
      if (unarchivedOnly) query = query.eq('is_archived', false);
      const { data, error } = await query;
      if (error) throw new AppError('NETWORK', 'Failed to load activities');
      const grouped: Record<string, Activity[]> = {};
      for (const a of (data ?? []) as any[]) {
        if (!grouped[a.group_id]) grouped[a.group_id] = [];
        grouped[a.group_id].push(mapActivityRow(a));
      }
      return grouped;
    },
    staleTime: STALE_TIMES.groups,
  });
}

/**
 * Fetch all submissions for the given groups, returning a count per group
 * and per (userId, groupId) for "all submitted today" logic.
 */
export function useGroupSubmissionCounts(groupIds: string[]) {
  return useQuery({
    queryKey: ['group-submission-counts', groupIds.slice().sort().join(',')] as const,
    enabled: groupIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('submissions')
        .select('user_id, group_id, client_timestamp')
        .in('group_id', groupIds)
        .gte(
          'client_timestamp',
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        );
      if (error) throw new AppError('NETWORK', 'Failed to load submissions');
      const today = new Date().toISOString().slice(0, 10);
      const countByGroup: Record<string, number> = {};
      const submittedTodayByGroup: Record<string, Set<string>> = {};
      for (const s of (data ?? []) as any[]) {
        countByGroup[s.group_id] = (countByGroup[s.group_id] ?? 0) + 1;
        if ((s.client_timestamp ?? '').slice(0, 10) === today) {
          if (!submittedTodayByGroup[s.group_id]) submittedTodayByGroup[s.group_id] = new Set();
          submittedTodayByGroup[s.group_id].add(s.user_id);
        }
      }
      return { countByGroup, submittedTodayByGroup };
    },
    staleTime: STALE_TIMES.feed,
  });
}

/**
 * Compute group streaks for all the user's groups in one query.
 * Returns Map<groupId, streakDays>.
 */
export function useAllGroupStreaks(groupIds: string[]) {
  return useQuery({
    queryKey: ['all-group-streaks', groupIds.slice().sort().join(',')] as const,
    enabled: groupIds.length > 0,
    queryFn: async (): Promise<Record<string, number>> => {
      // 1) Get members per group
      const { data: members, error: mErr } = await supabase
        .from('group_members')
        .select('user_id, group_id')
        .in('group_id', groupIds);
      if (mErr) throw new AppError('NETWORK', 'Failed to load members');
      const memberIdsByGroup: Record<string, string[]> = {};
      for (const m of (members ?? []) as any[]) {
        if (!memberIdsByGroup[m.group_id]) memberIdsByGroup[m.group_id] = [];
        memberIdsByGroup[m.group_id].push(m.user_id);
      }

      // 2) Get last 30 days of submissions
      const since = new Date(Date.now() - 30 * 86400_000).toISOString();
      const { data: subs, error: sErr } = await supabase
        .from('submissions')
        .select('user_id, group_id, client_timestamp')
        .in('group_id', groupIds)
        .gte('client_timestamp', since);
      if (sErr) throw new AppError('NETWORK', 'Failed to load submissions');

      // 3) Compute streak per group
      const byGroupUser: Record<string, Record<string, Set<string>>> = {};
      for (const s of (subs ?? []) as any[]) {
        if (!byGroupUser[s.group_id]) byGroupUser[s.group_id] = {};
        if (!byGroupUser[s.group_id][s.user_id]) byGroupUser[s.group_id][s.user_id] = new Set();
        byGroupUser[s.group_id][s.user_id].add((s.client_timestamp as string).slice(0, 10));
      }

      const streakByGroup: Record<string, number> = {};
      for (const gid of groupIds) {
        const memberIds = memberIdsByGroup[gid] ?? [];
        if (memberIds.length === 0) { streakByGroup[gid] = 0; continue; }
        let s = 0;
        for (let i = 0; i < 30; i++) {
          const day = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
          const allSubmitted = memberIds.every(uid => byGroupUser[gid]?.[uid]?.has(day));
          if (allSubmitted) s++;
          else break;
        }
        streakByGroup[gid] = s;
      }
      return streakByGroup;
    },
    staleTime: 60 * 1000,
  });
}

export function useUpdateActivity(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AddActivityInput> }): Promise<Activity> => {
      const payload: Record<string, any> = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.icon !== undefined) payload.icon = updates.icon;
      if (updates.color !== undefined) payload.color = updates.color;
      if (updates.frequency !== undefined) payload.frequency = updates.frequency;
      if (updates.frequencyDays !== undefined) payload.frequency_days = updates.frequencyDays;
      if (updates.restDaysPerWeek !== undefined) payload.rest_days_per_week = updates.restDaysPerWeek;
      if (updates.requirePhoto !== undefined) payload.require_photo = updates.requirePhoto;
      if (updates.templateKey !== undefined) payload.template_key = updates.templateKey;
      if (updates.templateFields !== undefined) payload.template_fields = updates.templateFields;

      const { data, error } = await supabase
        .from('activities')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new AppError('NETWORK', 'Failed to update activity');
      return mapActivityRow(data);
    },
    onSuccess: (activity) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activities(groupId) });
      queryClient.setQueryData(QUERY_KEYS.activity(activity.id), activity);
    },
  });
}
