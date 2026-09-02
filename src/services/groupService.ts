import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { AppError, isAppError } from '@/services/errors';
import {
  Activity,
  ActivitySeed,
  AddActivityInput,
  CreateGroupInput,
  Group,
  GroupMember,
  UpdateGroupInput,
  User,
} from '@/types';

/**
 * Group service — group CRUD, membership & activities against Supabase.
 * Real-time notification mirrors are written to the `notifications` table.
 */

const LOG_PREFIX = '[groupService]';
const INVITE_CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no ambiguous chars
const INVITE_CODE_LENGTH = 6;
const MAX_INVITE_ATTEMPTS = 5;
export const MAX_GROUP_MEMBERS = 6;

// ─── Row Mappers (snake_case DB → camelCase app types) ───────────────────────

function mapGroupRow(row: Record<string, any>): Group {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    vibe: row.vibe ?? null,
    goalDescription: row.goal_description ?? null,
    inviteCode: row.invite_code,
    submissionWindowStart: row.submission_window_start,
    submissionWindowEnd: row.submission_window_end,
    groupStreakEnabled: row.group_streak_enabled,
    memberCount: row.member_count,
    adminId: row.admin_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? null,
  };
}

function mapMemberRow(row: Record<string, any>): GroupMember {
  return {
    groupId: row.group_id,
    userId: row.user_id,
    role: row.role,
    joinedAt: row.joined_at,
    user: row.user ? mapUserRow(row.user) : undefined,
  };
}

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

function mapActivityRow(row: Record<string, any>): Activity {
  return {
    id: row.id,
    groupId: row.group_id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    templateKey: row.template_key ?? null,
    frequency: row.frequency,
    frequencyDays: row.frequency_days ?? [],
    restDaysPerWeek: row.rest_days_per_week ?? 1,
    requirePhoto: row.require_photo ?? false,
    templateFields: row.template_fields ?? [],
    isArchived: row.is_archived ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── Error Handling ──────────────────────────────────────────────────────────

function handleServiceError(operation: string, error: unknown): never {
  if (isAppError(error)) {
    console.error(`${LOG_PREFIX} ${operation}: ${error.code} — ${error.message}`);
    throw error;
  }
  console.error(`${LOG_PREFIX} ${operation}:`, error);
  throw new AppError('NETWORK', `${operation} failed`);
}

// ─── Internals ───────────────────────────────────────────────────────────────

function getCurrentUserId(): string {
  const uid = useAuthStore.getState().session?.user?.id;
  if (!uid) throw new AppError('NOT_AUTHENTICATED', 'No authenticated user');
  return uid;
}

async function fetchLiveGroup(groupId: string): Promise<Group> {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new AppError('NOT_FOUND', 'Group not found');
  return mapGroupRow(data);
}

async function requireAdmin(userId: string, groupId: string): Promise<void> {
  const { data, error } = await supabase
    .from('group_members')
    .select('role')
    .match({ group_id: groupId, user_id: userId })
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new AppError('NOT_FOUND', 'Membership not found');
  if (data.role !== 'admin') throw new AppError('NOT_ADMIN', 'Admin role required');
}

async function insertActivities(
  groupId: string,
  userId: string,
  seeds: ActivitySeed[]
): Promise<void> {
  const rows = seeds.map((seed) => ({
    group_id: groupId,
    name: seed.name,
    icon: seed.icon,
    color: seed.color,
    frequency: seed.frequency,
    frequency_days: seed.frequencyDays,
    require_photo: seed.requirePhoto,
    template_key: seed.templateKey ?? null,
    template_fields: seed.templateFields ?? [],
    created_by: userId,
  }));
  const { error } = await supabase.from('activities').insert(rows);
  if (error) throw error;
}

// ─── Invite Codes ────────────────────────────────────────────────────────────

export function generateInviteCode(): string {
  let code = '';
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += INVITE_CHARSET[Math.floor(Math.random() * INVITE_CHARSET.length)];
  }
  return code;
}

function isUniqueViolation(error: PostgrestError | null): boolean {
  return error?.code === '23505';
}

export function normalizeInviteCode(rawCode: string): string {
  return rawCode.trim().toUpperCase();
}

// ─── Group Lifecycle ─────────────────────────────────────────────────────────

export async function createGroup(
  input: CreateGroupInput,
  selectedTemplates?: ActivitySeed[]
): Promise<Group> {
  try {
    const userId = getCurrentUserId();

    for (let attempt = 0; attempt < MAX_INVITE_ATTEMPTS; attempt++) {
      const inviteCode = generateInviteCode();
      const { data, error } = await supabase
        .from('groups')
        .insert({
          name: input.name,
          emoji: input.emoji,
          vibe: input.vibe,
          goal_description: input.goalDescription,
          admin_id: userId,
          member_count: 1,
          invite_code: inviteCode,
        })
        .select()
        .single();

      if (!error) {
        const group = mapGroupRow(data);
        const { error: memberError } = await supabase
          .from('group_members')
          .insert({ group_id: group.id, user_id: userId, role: 'admin' });
        if (memberError) throw memberError;

        if (selectedTemplates && selectedTemplates.length > 0) {
          await insertActivities(group.id, userId, selectedTemplates);
        }
        return group;
      }

      if (!isUniqueViolation(error)) throw error;
      // Invite code collision — regenerate and retry
    }

    throw new AppError('NETWORK', 'Could not generate a unique invite code');
  } catch (error) {
    handleServiceError('createGroup', error);
  }
}

export async function getGroupByInviteCode(code: string): Promise<Group | null> {
  try {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('invite_code', normalizeInviteCode(code))
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw error;
    return data ? mapGroupRow(data) : null;
  } catch (error) {
    handleServiceError('getGroupByInviteCode', error);
  }
}

export async function joinGroupByCode(code: string): Promise<Group> {
  try {
    const userId = getCurrentUserId();
    const group = await getGroupByInviteCode(code);
    if (!group) throw new AppError('NOT_FOUND', 'Invalid invite code');
    if (group.memberCount >= MAX_GROUP_MEMBERS) {
      throw new AppError('GROUP_FULL', 'This pact is full');
    }

    const { data: existing } = await supabase
      .from('group_members')
      .select('user_id')
      .match({ group_id: group.id, user_id: userId })
      .maybeSingle();
    if (existing) throw new AppError('ALREADY_MEMBER', 'You already joined this pact');

    const { error: joinError } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: userId, role: 'member' });
    if (joinError) throw joinError;

    const { error: incrementError } = await supabase
      .from('groups')
      .update({ member_count: group.memberCount + 1 })
      .eq('id', group.id);
    if (incrementError) throw incrementError;

    await createJoinNotification(userId, group);

    return { ...group, memberCount: group.memberCount + 1 };
  } catch (error) {
    handleServiceError('joinGroupByCode', error);
  }
}

async function createJoinNotification(userId: string, group: Group): Promise<void> {
  try {
    const username =
      useAuthStore.getState().user?.username ||
      useAuthStore.getState().user?.displayName ||
      'Someone';

    const { error } = await supabase.from('notifications').insert({
      user_id: group.adminId,
      type: 'new_group_member',
      title: 'New member!',
      body: `${username} joined ${group.emoji} ${group.name}`,
      deep_link: `streakpact://group/${group.id}`,
    });
    if (error) console.error(`${LOG_PREFIX} createJoinNotification:`, error);
  } catch (err) {
    // Notifications are best-effort — never fail a join because the admin
    // didn't get a notification.
    console.error(`${LOG_PREFIX} createJoinNotification:`, err);
  }
}

export async function leaveGroup(groupId: string): Promise<void> {
  try {
    const userId = getCurrentUserId();
    const group = await fetchLiveGroup(groupId);

    const { data: members, error } = await supabase
      .from('group_members')
      .select('user_id, role')
      .eq('group_id', groupId);
    if (error) throw error;

    const rows = (members ?? []) as Record<string, any>[];
    const mine = rows.find((m) => m.user_id === userId);
    if (!mine) throw new AppError('NOT_FOUND', 'You are not a member of this group');

    const adminCount = rows.filter((m) => m.role === 'admin').length;
    if (mine.role === 'admin' && adminCount === 1 && group.memberCount > 1) {
      throw new AppError('NOT_ALLOWED', 'Promote another admin before leaving');
    }

    const { error: deleteError } = await supabase
      .from('group_members')
      .delete()
      .match({ group_id: groupId, user_id: userId });
    if (deleteError) throw deleteError;

    const { error: decrementError } = await supabase
      .from('groups')
      .update({ member_count: Math.max(0, group.memberCount - 1) })
      .eq('id', groupId);
    if (decrementError) throw decrementError;
  } catch (error) {
    handleServiceError('leaveGroup', error);
  }
}

// ─── Group Reads ─────────────────────────────────────────────────────────────

export async function fetchUserGroups(): Promise<Group[]> {
  try {
    const userId = getCurrentUserId();
    const { data, error } = await supabase
      .from('group_members')
      .select('group:groups(*)')
      .eq('user_id', userId);
    if (error) throw error;

    return ((data ?? []) as Record<string, any>[])
      .filter((row) => row.group && !row.group.deleted_at)
      .map((row) => mapGroupRow(row.group))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (error) {
    handleServiceError('fetchUserGroups', error);
  }
}

export async function fetchGroupWithMembers(
  groupId: string
): Promise<{ group: Group; members: GroupMember[] }> {
  try {
    const { data, error } = await supabase
      .from('groups')
      .select('*, group_members(*, user:users(*))')
      .eq('id', groupId)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new AppError('NOT_FOUND', 'Group not found');

    const members = ((data.group_members ?? []) as Record<string, any>[]).map(mapMemberRow);
    members.sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
    return { group: mapGroupRow(data), members };
  } catch (error) {
    handleServiceError('fetchGroupWithMembers', error);
  }
}

// ─── Group Admin Operations ──────────────────────────────────────────────────

export async function updateGroup(groupId: string, updates: UpdateGroupInput): Promise<Group> {
  try {
    const userId = getCurrentUserId();
    await requireAdmin(userId, groupId);

    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.emoji !== undefined) payload.emoji = updates.emoji;
    if (updates.vibe !== undefined) payload.vibe = updates.vibe;
    if (updates.goalDescription !== undefined) payload.goal_description = updates.goalDescription;
    if (updates.submissionWindowStart !== undefined) {
      payload.submission_window_start = updates.submissionWindowStart;
    }
    if (updates.submissionWindowEnd !== undefined) {
      payload.submission_window_end = updates.submissionWindowEnd;
    }
    if (updates.groupStreakEnabled !== undefined) {
      payload.group_streak_enabled = updates.groupStreakEnabled;
    }

    const { data, error } = await supabase
      .from('groups')
      .update(payload)
      .eq('id', groupId)
      .select()
      .single();
    if (error) throw error;
    return mapGroupRow(data);
  } catch (error) {
    handleServiceError('updateGroup', error);
  }
}

export async function removeMember(groupId: string, userIdToRemove: string): Promise<void> {
  try {
    const userId = getCurrentUserId();
    await requireAdmin(userId, groupId);
    if (userIdToRemove === userId) {
      throw new AppError('NOT_ALLOWED', 'Use leaveGroup to remove yourself');
    }

    const group = await fetchLiveGroup(groupId);

    const { error: deleteError } = await supabase
      .from('group_members')
      .delete()
      .match({ group_id: groupId, user_id: userIdToRemove });
    if (deleteError) throw deleteError;

    const { error: decrementError } = await supabase
      .from('groups')
      .update({ member_count: Math.max(0, group.memberCount - 1) })
      .eq('id', groupId);
    if (decrementError) throw decrementError;
  } catch (error) {
    handleServiceError('removeMember', error);
  }
}

export async function regenerateInviteCode(groupId: string): Promise<string> {
  try {
    const userId = getCurrentUserId();
    await requireAdmin(userId, groupId);

    for (let attempt = 0; attempt < MAX_INVITE_ATTEMPTS; attempt++) {
      const inviteCode = generateInviteCode();
      const { data, error } = await supabase
        .from('groups')
        .update({ invite_code: inviteCode })
        .eq('id', groupId)
        .select('invite_code')
        .single();

      if (!error) return (data as Record<string, any>).invite_code as string;
      if (!isUniqueViolation(error)) throw error;
      // Collision — regenerate and retry
    }

    throw new AppError('NETWORK', 'Could not generate a unique invite code');
  } catch (error) {
    handleServiceError('regenerateInviteCode', error);
  }
}

export async function deleteGroup(groupId: string): Promise<void> {
  try {
    const userId = getCurrentUserId();
    await requireAdmin(userId, groupId);

    const { error } = await supabase
      .from('groups')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', groupId);
    if (error) throw error;
  } catch (error) {
    handleServiceError('deleteGroup', error);
  }
}

// ─── Activities ──────────────────────────────────────────────────────────────

export async function fetchGroupActivities(
  groupId: string,
  unarchivedOnly: boolean = true
): Promise<Activity[]> {
  try {
    let query = supabase.from('activities').select('*').eq('group_id', groupId);
    if (unarchivedOnly) query = query.eq('is_archived', false);

    const { data, error } = await query.order('created_at', { ascending: true });
    if (error) throw error;
    return ((data ?? []) as Record<string, any>[]).map(mapActivityRow);
  } catch (error) {
    handleServiceError('fetchGroupActivities', error);
  }
}

export async function addActivity(
  groupId: string,
  input: AddActivityInput
): Promise<Activity> {
  try {
    const userId = getCurrentUserId();
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
        created_by: userId,
      })
      .select()
      .single();
    if (error) throw error;
    return mapActivityRow(data);
  } catch (error) {
    handleServiceError('addActivity', error);
  }
}

export async function archiveActivity(activityId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('activities')
      .update({ is_archived: true })
      .eq('id', activityId);
    if (error) throw error;
  } catch (error) {
    handleServiceError('archiveActivity', error);
  }
}

// ─── Group Streak ─────────────────────────────────────────────────────────────

/**
 * Compute the current group streak: the number of consecutive days
 * (ending today) on which every current member has at least one submission.
 *
 * Cheap client-side implementation. For groups with many members
 * and many submissions, a Postgres function would be faster; this is
 * fine up to ~50 members + a few hundred submissions.
 */
export async function getGroupStreak(groupId: string): Promise<number> {
  try {
    // Get current members
    const { data: members, error: mErr } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);
    if (mErr) throw mErr;
    const memberIds = (members ?? []).map((m: any) => m.user_id);
    if (memberIds.length === 0) return 0;

    // Pull the last 30 days of submissions for the group
    const since = new Date(Date.now() - 30 * 86400_000).toISOString();
    const { data: subs, error: sErr } = await supabase
      .from('submissions')
      .select('user_id, client_timestamp')
      .eq('group_id', groupId)
      .gte('client_timestamp', since);
    if (sErr) throw sErr;

    // Build a set: { userId → Set<YYYY-MM-DD> }
    const byUserDay = new Map<string, Set<string>>();
    for (const s of subs ?? []) {
      const day = (s.client_timestamp as string).slice(0, 10);
      if (!byUserDay.has(s.user_id)) byUserDay.set(s.user_id, new Set());
      byUserDay.get(s.user_id)!.add(day);
    }

    // Walk back from today, requiring every member to have submitted
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const day = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
      const allSubmitted = memberIds.every((uid) => byUserDay.get(uid)?.has(day));
      if (allSubmitted) streak++;
      else break;
    }
    return streak;
  } catch (error) {
    handleServiceError('getGroupStreak', error);
  }
}
