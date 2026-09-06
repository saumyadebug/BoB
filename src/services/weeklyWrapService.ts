import { supabase } from './supabase';
import { AppError } from './errors';

export interface WeeklyWrapupData {
  groupId: string;
  groupName: string;
  groupEmoji: string;
  weekStartDate: string;
  weekEndDate: string;
  totalSubmissions: number;
  consistencyRate: number; // 0 - 100
  topStreak: number;
  mvp: {
    userId: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
    submissionCount: number;
  } | null;
}

/**
 * Computes or retrieves the 7-day weekly wrap-up summary for a squad.
 */
export async function fetchGroupWeeklyWrapup(groupId: string): Promise<WeeklyWrapupData> {
  const now = new Date();
  const weekEndDate = now.toISOString().slice(0, 10);
  const weekStart = new Date(now.getTime() - 7 * 86400000);
  const weekStartDate = weekStart.toISOString().slice(0, 10);

  // 1. Fetch group details
  const { data: group, error: groupErr } = await supabase
    .from('groups')
    .select('id, name, emoji')
    .eq('id', groupId)
    .single();

  if (groupErr || !group) {
    throw new AppError('NOT_FOUND', 'Group not found');
  }

  // 2. Fetch members
  const { data: members, error: membersErr } = await supabase
    .from('group_members')
    .select('user_id, role, users ( id, display_name, username, avatar_url, xp )')
    .eq('group_id', groupId);

  const memberList = members ?? [];

  // 3. Fetch submissions in last 7 days
  const { data: submissions, error: subErr } = await supabase
    .from('submissions')
    .select('id, user_id, client_timestamp')
    .eq('group_id', groupId)
    .gte('client_timestamp', weekStart.toISOString());

  const subList = submissions ?? [];
  const totalSubmissions = subList.length;

  // Calculate MVP
  const subCounts = new Map<string, number>();
  for (const s of subList) {
    subCounts.set(s.user_id, (subCounts.get(s.user_id) || 0) + 1);
  }

  let mvpUserId: string | null = null;
  let mvpCount = 0;
  for (const [userId, count] of subCounts.entries()) {
    if (count > mvpCount) {
      mvpCount = count;
      mvpUserId = userId;
    }
  }

  const mvpMember = memberList.find((m: any) => m.user_id === mvpUserId);

  // Consistency: (actual submissions / (members * 7)) * 100
  const expectedTotal = Math.max(1, memberList.length * 7);
  const consistencyRate = Math.min(100, Math.round((totalSubmissions / expectedTotal) * 100));

  // Top streak
  const userIds = memberList.map((m: any) => m.user_id);
  let topStreak = 0;
  if (userIds.length > 0) {
    const { data: streaks } = await supabase
      .from('streaks')
      .select('current_streak')
      .in('user_id', userIds)
      .order('current_streak', { ascending: false })
      .limit(1);

    topStreak = streaks?.[0]?.current_streak ?? 0;
  }

  return {
    groupId: group.id,
    groupName: group.name,
    groupEmoji: group.emoji,
    weekStartDate,
    weekEndDate,
    totalSubmissions,
    consistencyRate,
    topStreak,
    mvp: mvpMember ? {
      userId: mvpMember.user_id,
      displayName: (mvpMember.users as any)?.display_name ?? 'MVP',
      username: (mvpMember.users as any)?.username ?? 'member',
      avatarUrl: (mvpMember.users as any)?.avatar_url ?? null,
      submissionCount: mvpCount,
    } : null,
  };
}
