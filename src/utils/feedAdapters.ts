import { Submission, Activity, GroupMember, Streak } from '@/types';
import { IconName } from '@/components/ui/Icon';

/**
 * Adapters: map database rows to UI-friendly shapes for FeedCard and TodayBanner.
 *
 * These exist so the screens don't have to do all the camelCase / fallback
 * logic inline, and so the format is consistent across HomeScreen and any
 * other place that renders a feed card.
 */

export interface FeedCardView {
  id: string;
  user: { id?: string; name: string; avatarUrl?: string | null; groupName: string };
  activity: { id?: string; name: string; icon: IconName; color: string };
  submission: {
    id: string;
    photoUrl?: string;
    title?: string;
    description?: string;
    summaryText?: string;
    timestamp: string;
    streakCount: number;
    reactions: number;
    comments: number;
  };
}

function relativeTime(iso: string): string {
  if (!iso || typeof iso !== 'string') return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function submissionToFeedCard(
  s: Submission,
  groupNameById: Record<string, string> = {}
): FeedCardView {
  return {
    id: s.id,
    user: {
      id: s.userId,
      name: s.user?.displayName ?? s.user?.username ?? 'Someone',
      avatarUrl: s.user?.avatarUrl ?? null,
      groupName: groupNameById[s.groupId] ?? 'Pact',
    },
    activity: {
      id: s.activityId,
      name: s.activity?.name ?? 'Activity',
      icon: (s.activity?.icon as IconName) ?? 'target',
      color: s.activity?.color ?? '#6B7280',
    },
    submission: {
      id: s.id,
      photoUrl: s.photoUrl ?? undefined,
      title: s.title ?? undefined,
      description: s.description ?? undefined,
      summaryText: '', // TODO: derive from fieldValues (Phase 5)
      timestamp: relativeTime(s.clientTimestamp),
      streakCount: 0, // populated from streak row when present
      reactions: 0,
      comments: 0,
    },
  };
}

export function submissionToFeedCardWithStreak(
  s: Submission,
  streak: Streak | undefined,
  groupNameById: Record<string, string> = {}
): FeedCardView {
  const view = submissionToFeedCard(s, groupNameById);
  if (streak) {
    view.submission.streakCount = streak.currentStreak;
  }
  return view;
}

/**
 * Build the "Today" banner from the user's activities + their submissions today.
 * `todayDateISO` is a YYYY-MM-DD string in the device timezone.
 */
export interface TodayActivityView {
  id: string;
  name: string;
  icon: IconName;
  color: string;
  status: 'pending' | 'submitted' | 'rest' | 'missed';
  groupId?: string;
  activityId?: string;
}

export function buildTodayBanner(
  activities: Activity[],
  todaySubmissions: Submission[],
  todayDateISO: string,
  restDayByActivity: Record<string, boolean> = {}
): TodayActivityView[] {
  return activities
    .filter(a => !a.isArchived)
    .map(a => {
      const submitted = todaySubmissions.some(
        s => s.activityId === a.id && s.clientTimestamp.slice(0, 10) === todayDateISO
      );
      const isRestDay = !!restDayByActivity[a.id];
      const status: TodayActivityView['status'] = isRestDay
        ? 'rest'
        : submitted
          ? 'submitted'
          : 'pending';
      return {
        id: a.id,
        name: a.name,
        icon: (a.icon as IconName) || 'target',
        color: a.color,
        status,
        groupId: a.groupId,
        activityId: a.id,
      };
    });
}
