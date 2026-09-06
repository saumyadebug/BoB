// supabase/functions/weekly-wrapup/index.ts
// Scheduled function (runs Sundays at 19:00 UTC) to generate weekly wrap-up stats
// for each active squad: MVP, consistency score, total submissions, top streak.

import { createAdminClient } from '../_shared/supabase-client.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createAdminClient();
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();

    // 1. Fetch all active groups
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('id, name, emoji, member_count');

    if (groupsError) {
      return errorResponse('Failed to fetch groups', 500, groupsError);
    }

    const wrapups = [];

    for (const group of (groups ?? [])) {
      // 2. Fetch group members
      const { data: members } = await supabase
        .from('group_members')
        .select('user_id, role, users ( id, display_name, username, avatar_url, xp )')
        .eq('group_id', group.id);

      const memberList = members ?? [];
      if (memberList.length === 0) continue;

      // 3. Fetch submissions in the last 7 days
      const { data: submissions } = await supabase
        .from('submissions')
        .select('id, user_id, activity_id, client_timestamp, xp_awarded')
        .eq('group_id', group.id)
        .gte('client_timestamp', sevenDaysAgo);

      const subList = submissions ?? [];
      const totalSubmissions = subList.length;

      // Calculate member submission counts to determine MVP
      const memberSubmissionMap = new Map<string, number>();
      for (const s of subList) {
        memberSubmissionMap.set(s.user_id, (memberSubmissionMap.get(s.user_id) || 0) + 1);
      }

      let mvpUserId: string | null = null;
      let mvpSubCount = 0;
      for (const [userId, count] of memberSubmissionMap.entries()) {
        if (count > mvpSubCount) {
          mvpSubCount = count;
          mvpUserId = userId;
        }
      }

      const mvpMember = memberList.find((m: any) => m.user_id === mvpUserId);

      // Consistency: (actual submissions / (members * 7)) * 100
      const expectedTotal = memberList.length * 7;
      const consistencyRate = expectedTotal > 0
        ? Math.min(100, Math.round((totalSubmissions / expectedTotal) * 100))
        : 0;

      // Longest streak in the group
      const { data: streaks } = await supabase
        .from('streaks')
        .select('current_streak, user_id')
        .in('user_id', memberList.map((m: any) => m.user_id))
        .order('current_streak', { ascending: false })
        .limit(1);

      const topStreak = streaks?.[0]?.current_streak ?? 0;

      wrapups.push({
        groupId: group.id,
        groupName: group.name,
        groupEmoji: group.emoji,
        weekEndDate: now.toISOString().slice(0, 10),
        totalSubmissions,
        consistencyRate,
        topStreak,
        mvp: mvpMember ? {
          userId: mvpMember.user_id,
          displayName: (mvpMember.users as any)?.display_name,
          username: (mvpMember.users as any)?.username,
          avatarUrl: (mvpMember.users as any)?.avatar_url,
          submissionCount: mvpSubCount,
        } : null,
      });
    }

    return jsonResponse({
      success: true,
      generatedAt: now.toISOString(),
      wrapupsCount: wrapups.length,
      wrapups,
    });
  } catch (err: any) {
    return errorResponse(err.message ?? 'Internal Server Error', 500);
  }
});
