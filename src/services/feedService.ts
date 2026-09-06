import { supabase } from './supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { MockFeedItem } from '@/hooks/useMockFeed';
import { Reaction, Submission } from '@/types';
import { firestore, subscribeToGroupFeed } from './firebase';

const LOG_PREFIX = '[feedService]';

/**
 * Fetch aggregated feed items for the user's groups.
 * Joins user profile, group visual identity, activity data, and reactions.
 */
export async function fetchAggregatedFeed(
  limitCount: number = 20,
  filterUserId?: string
): Promise<MockFeedItem[]> {
  try {
    let query = supabase
      .from('submissions')
      .select(`
        *,
        user:users!submissions_user_id_fkey(*),
        activity:activities!submissions_activity_id_fkey(*),
        group:groups!submissions_group_id_fkey(id, name, emoji)
      `)
      .order('client_timestamp', { ascending: false })
      .limit(limitCount);

    if (filterUserId) {
      query = query.eq('user_id', filterUserId);
    }

    const { data: rows, error } = await query;

    if (error || !rows || rows.length === 0) {
      return [];
    }

    // Fetch streaks for streak counts
    const userIds = Array.from(new Set(rows.map((r: any) => r.user_id)));
    const { data: streakRows = [] } = await supabase
      .from('streaks')
      .select('user_id, activity_id, current_streak')
      .in('user_id', userIds);

    const streakMap = new Map<string, number>();
    for (const st of (streakRows as any[])) {
      streakMap.set(`${st.user_id}_${st.activity_id}`, st.current_streak);
    }

    const feedItems: MockFeedItem[] = rows.map((row: any) => {
      const streakCount = streakMap.get(`${row.user_id}_${row.activity_id}`) ?? 1;

      return {
        id: row.id,
        userId: row.user_id,
        activityId: row.activity_id,
        groupId: row.group_id,
        groupName: row.group?.name || 'PACT',
        groupColor: row.activity?.color || '#3B82F6',
        photoUrl: row.photo_url ?? null,
        title: row.title ?? (row.activity?.name ? `${row.activity.name} Session` : 'Streak Proof'),
        description: row.description ?? null,
        fieldValues: row.field_values ?? {},
        xpEarned: row.xp_earned ?? 50,
        clientTimestamp: row.client_timestamp,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        streakCount,
        initialReactions: [],
        commentCount: 0,
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
    });

    return feedItems;
  } catch (err) {
    console.warn(`${LOG_PREFIX} Error fetching feed:`, err);
    return [];
  }
}
