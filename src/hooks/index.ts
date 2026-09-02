// Barrel for React Query hooks. Import from '@/hooks' rather than the individual files.
export * from './useAuthSync';
export * from './useCurrentUser';

// useActivities has the canonical activity hooks. useGroups re-exports them
// for backward-compat, so we export from one place only to avoid the conflict.
export {
  useGroupActivities,
  useActivity,
  useAddActivity,
  useArchiveActivity,
  useUnarchiveActivity,
  useUpdateActivity,
  useAllGroupActivities,
  useGroupSubmissionCounts,
  useAllGroupStreaks,
} from './useActivities';

export * from './useSubmissions';
// useFeedSubmissions is also re-exported by useSubmissions above
export * from './useStreaks';
export * from './useBadges';

// useGroups last because it re-exports useGroupActivities (handled above).
export * from './useGroups';
export { useGroupStreak, useMyGroupMembers } from './useGroups';
export type { LeaderboardEntry } from './useGroups';
