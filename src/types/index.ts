/**
 * StreakPact — Core Type Definitions
 * Mirrors the Supabase DB schema from the implementation plan.
 */

// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;                     // Firebase UID / Supabase UUID
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  xp: number;
  level: number;                  // 1–7
  totalSubmissions: number;
  longestStreak: number;
  shieldsAvailable: number;       // 0–3
  createdAt: string;              // ISO timestamp
  updatedAt: string;
}

// ─── Group ───────────────────────────────────────────────────────────────────

export type GroupVibe = 'hustle' | 'study' | 'gym' | 'custom';

export interface Group {
  id: string;
  name: string;
  emoji: string;
  vibe: GroupVibe | null;
  goalDescription: string | null;
  inviteCode: string;             // 6-char ambiguity-safe code
  submissionWindowStart: string;  // HH:MM
  submissionWindowEnd: string;    // HH:MM
  groupStreakEnabled: boolean;
  memberCount: number;
  adminId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;      // Soft delete timestamp
}

export type GroupRole = 'admin' | 'member';

export interface GroupMember {
  groupId: string;
  userId: string;
  role: GroupRole;
  joinedAt: string;
  user?: User;                    // Joined data
}

// ─── Activity ────────────────────────────────────────────────────────────────

export type ActivityFrequency = 'daily' | 'specific_days' | 'x_per_week';

export type FieldType =
  | 'text'
  | 'number'
  | 'multiselect'
  | 'singleselect'
  | 'toggle'
  | 'stars'
  | 'emoji-scale';

export interface FieldDefinition {
  id: string;
  label: string;
  type: FieldType;
  options?: string[];
  required: boolean;
  unit?: string;                  // e.g. "min", "km", "pages"
}

export interface Activity {
  id: string;
  groupId: string;
  name: string;
  icon: string;
  color: string;
  templateKey: string | null;     // null = custom
  frequency: ActivityFrequency;
  frequencyDays: number[];        // 0=Sun … 6=Sat
  restDaysPerWeek: number;        // 0–2
  requirePhoto: boolean;
  templateFields: FieldDefinition[];
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Submission ───────────────────────────────────────────────────────────────

export interface Submission {
  id: string;
  userId: string;
  activityId: string;
  groupId: string;
  photoUrl: string | null;
  title: string | null;
  description: string | null;
  fieldValues: Record<string, any>; // { fieldId: value }
  xpEarned: number;
  clientTimestamp: string;          // Device time for timezone edge cases
  createdAt: string;
  updatedAt: string;
  user?: User;                      // Joined
  activity?: Activity;              // Joined
}

// ─── Streak ──────────────────────────────────────────────────────────────────

export interface Streak {
  id: string;
  userId: string;
  activityId: string;
  currentStreak: number;
  longestStreak: number;
  lastSubmissionDate: string;       // YYYY-MM-DD
  shieldUsedDates: string[];        // YYYY-MM-DD[]
  restDayDates: string[];           // YYYY-MM-DD[]
  updatedAt: string;
}

// ─── Badge / Achievement ──────────────────────────────────────────────────────

export type BadgeCategory = 'streak' | 'activity' | 'social' | 'special';

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  condition: Record<string, any>;   // e.g. { streakDays: 7 }
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  earnedAt: string;
  badge?: BadgeDefinition;
}

// ─── Feed / Social ────────────────────────────────────────────────────────────

export interface Reaction {
  submissionId: string;
  userId: string;
  emoji: '🔥' | '💪' | '👏' | '❤️' | '💯';
  createdAt: string;
  user?: User;
}

export interface Comment {
  id: string;
  submissionId: string;
  userId: string;
  text: string;
  createdAt: string;
  user?: User;
}

export interface Nudge {
  id: string;
  senderId: string;
  recipientId: string;
  groupId: string;
  activityId: string;
  sentAt: string;
  wasConverted: boolean;           // Did recipient submit within 2h?
  sender?: User;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export type NotificationType =
  | 'daily_reminder'
  | 'teammate_submitted'
  | 'streak_at_risk'
  | 'streak_broken'
  | 'streak_milestone'
  | 'nudge_received'
  | 'reaction_received'
  | 'comment_received'
  | 'new_group_member'
  | 'weekly_wrapup'
  | 'badge_earned'
  | 'level_up'
  | 'shield_earned';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  deepLink: string | null;        // e.g. "streakpact://submission/123"
  isRead: boolean;
  createdAt: string;
}

// ─── UI State Types ───────────────────────────────────────────────────────────

export type StreakStatus = 'submitted' | 'pending' | 'missed' | 'rest' | 'inactive';

export interface DayStatus {
  date: string;                   // YYYY-MM-DD
  status: StreakStatus;
  submissionId?: string;
}

// ─── Service Input Types ─────────────────────────────────────────────────────

export interface CreateGroupInput {
  name: string;
  emoji: string;
  vibe: GroupVibe | null;
  goalDescription: string | null;
}

export interface ActivitySeed {
  name: string;
  icon: string;
  color: string;
  templateKey?: string | null;
  templateFields?: FieldDefinition[];
  frequency: ActivityFrequency;
  frequencyDays: number[];        // 0=Sun … 6=Sat
  requirePhoto: boolean;
}

export interface AddActivityInput {
  name: string;
  icon: string;
  color: string;
  templateKey?: string | null;
  templateFields?: FieldDefinition[];
  frequency?: ActivityFrequency;
  frequencyDays?: number[];
  requirePhoto?: boolean;
}

export interface UpdateGroupInput {
  name?: string;
  emoji?: string;
  vibe?: GroupVibe | null;
  goalDescription?: string | null;
  submissionWindowStart?: string; // HH:MM
  submissionWindowEnd?: string;   // HH:MM
  groupStreakEnabled?: boolean;
}

// ─── Navigation Param Types ──────────────────────────────────────────────────

export type AuthStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  SetupProfile: undefined;
  JoinOrCreate: undefined;
  BiometricSetup: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Groups: undefined;
  Submit: undefined;
  Leaderboard: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  CreateGroup: undefined;
  JoinGroup: { code?: string } | undefined;
  GroupHome: { groupId: string; groupName?: string; groupEmoji?: string };
  GroupSettings: { groupId: string };
  CreateActivity: { groupId: string };
  ActivityDetail: { activity?: Activity; groupId?: string };
  SubmissionFlow: { activityId?: string; groupId?: string } | undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
