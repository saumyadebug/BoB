// Base components
export * from './Text';
export * from './Button';
export * from './Card';
export * from './Input';
export * from './Avatar';
export * from './Badge';
export * from './Chip';
export * from './StatusIndicator';
export * from './BottomSheet';
export * from './DynamicForm';
export * from './PreviewCard';
export * from './CalendarGrid';
export * from './StreakSummaryBar';
export * from './ComparativeView';
export * from './YearOverviewHeatmap';
export * from './Icon';
export * from './PhosphorIcon';

// Animated components
export * from './SkeletonLoader';
export * from './StreakCounter';
export * from './XPChip';
export * from './ConfettiBurst';

// Brand
export * from '../brand/VoltMark';

// Feed & groups: NOT re-exported from the barrel.
// Import them directly: `import { FeedCard } from '@/components/feed/FeedCard'`
// (re-exporting here creates a require cycle — see PR #123)
export { FeedCard } from '../feed/FeedCard';
export type { FeedCardProps, FeedCardSubmission } from '../feed/FeedCard';
export { TodayBanner } from '../feed/TodayBanner';
export type { TodayActivity, TodayStatus } from '../feed/TodayBanner';
export { GroupCard } from '../groups/GroupCard';
export type { GroupCardProps } from '../groups/GroupCard';
export { ActivityCard } from '../groups/ActivityCard';
export type { MemberActivityStatus } from '../groups/ActivityCard';
export { StackedAvatars } from '../groups/StackedAvatars';
