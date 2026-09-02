import React from 'react';
import { View, StyleSheet, Image, Pressable } from 'react-native';
import { Card } from '../ui/Card';
import { Text } from '../ui/Text';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Icon, IconName } from '../ui/Icon';
import { COLORS, RADIUS, SHADOWS, SPACE } from '@/constants/theme';

export interface FeedCardSubmission {
  id: string;
  photoUrl?: string;
  title?: string;
  description?: string;
  summaryText?: string;
  timestamp: string;
  streakCount: number;
  reactions: number;
  comments: number;
}

export interface FeedCardProps {
  user: { id?: string; name: string; avatarUrl?: string | null; groupName: string };
  activity: { id?: string; name: string; icon: IconName; color: string };
  submission: FeedCardSubmission;
  onReact?: () => void;
  onComment?: () => void;
  onPress?: () => void;
}

/**
 * Editorial card layout: photo is the hero, content stacks beneath.
 * No side-stripe border (forbidden in the design system).
 * Reaction count uses phosphor icons, not emoji.
 */
export function FeedCard({ user, activity, submission, onReact, onComment, onPress }: FeedCardProps) {
  return (
    <Card variant="elevated" padding="none" onPress={onPress} style={styles.card}>
      {/* Activity color bar — thin, top-anchored, full-width */}
      <View style={[styles.activityBar, { backgroundColor: activity.color }]} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Avatar src={user.avatarUrl} name={user.name} size="md" />
          <View style={styles.userText}>
            <Text variant="headingSm" color={COLORS.inkDisplay} numberOfLines={1}>
              {user.name}
            </Text>
            <Text variant="caption" color={COLORS.inkSecondary} numberOfLines={1}>
              {user.groupName} · {submission.timestamp}
            </Text>
          </View>
        </View>
        <View style={[styles.activityPill, { backgroundColor: hexToTint(activity.color) }]}>
          <Icon name={activity.icon} size={14} color={activity.color} />
          <Text variant="label" style={{ color: activity.color, fontSize: 12 }}>
            {activity.name}
          </Text>
        </View>
      </View>

      {/* Photo hero */}
      {submission.photoUrl ? (
        <View style={styles.photoWrap}>
          <Image source={{ uri: submission.photoUrl }} style={styles.photo} resizeMode="cover" />
          {submission.streakCount > 0 ? (
            <View style={styles.streakChip}>
              <Icon name="flame" size={14} color="#FFFFFF" />
              <Text variant="label" color="#FFFFFF" style={styles.streakText}>
                Day {submission.streakCount}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Content */}
      {(submission.title || submission.description) ? (
        <View style={styles.content}>
          {submission.title ? (
            <Text variant="headingMd" color={COLORS.inkDisplay} numberOfLines={2}>
              {submission.title}
            </Text>
          ) : null}
          {submission.description ? (
            <Text
              variant="bodySm"
              color={COLORS.inkSecondary}
              numberOfLines={3}
              style={styles.description}
            >
              {submission.description}
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable onPress={onReact} style={styles.footerAction} hitSlop={6}>
          <Icon name="fire" size={18} color={COLORS.inkPrimary} />
          <Text variant="label" color={COLORS.inkPrimary}>{submission.reactions}</Text>
        </Pressable>
        <Pressable onPress={onComment} style={styles.footerAction} hitSlop={6}>
          <Icon name="chat-circle" size={18} color={COLORS.inkPrimary} />
          <Text variant="label" color={COLORS.inkPrimary}>{submission.comments}</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable onPress={onPress} hitSlop={6} style={styles.footerAction}>
          <Icon name="arrow-up-right" size={18} color={COLORS.inkSecondary} />
        </Pressable>
      </View>
    </Card>
  );
}

function hexToTint(hex: string, alpha: number = 0.12) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  activityBar: {
    height: 3,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 12,
    gap: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  userText: {
    flex: 1,
  },
  activityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    gap: 5,
  },
  photoWrap: {
    position: 'relative',
  },
  photo: {
    width: '100%',
    aspectRatio: 4 / 5,
    backgroundColor: COLORS.surfaceSunken,
  },
  streakChip: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 14, 16, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    gap: 4,
  },
  streakText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 12,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
    gap: 6,
  },
  description: {
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.hairline,
    gap: 16,
  },
  footerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
});

export default FeedCard;
