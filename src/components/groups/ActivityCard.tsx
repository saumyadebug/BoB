import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StreakCounter } from '@/components/ui/StreakCounter';
import { Icon, IconName } from '@/components/ui/Icon';
import { COLORS, RADIUS } from '@/constants/theme';
import { Activity, GroupMember } from '@/types';

export type MemberActivityStatus = {
  member: GroupMember;
  currentStreak: number;
  hasSubmittedToday: boolean;
};

interface ActivityCardProps {
  activity: Activity;
  memberStatuses: MemberActivityStatus[];
  onPress: () => void;
  onSubmit: () => void;
}

export function ActivityCard({ activity, memberStatuses, onPress, onSubmit }: ActivityCardProps) {
  const iconName = (activity.icon as IconName) || 'target';
  return (
    <Card variant="elevated" padding="none" onPress={onPress} style={styles.card}>
      {/* Activity color band â€” 4px top, full-width, no side stripe */}
      <View style={[styles.headerEdge, { backgroundColor: activity.color }]} />

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.iconBox, { backgroundColor: hexToTint(activity.color) }]}>
            <Icon name={iconName} size={22} color={activity.color} />
          </View>
          <View style={styles.titleContainer}>
            <Text variant="headingMd" color={COLORS.textPrimary} numberOfLines={1}>
              {activity.name}
            </Text>
            <Text variant="caption" color={COLORS.textSecondary}>
              {activity.frequency === 'daily' ? 'Daily' : 'Custom days'}
            </Text>
          </View>
        </View>

        <View style={styles.grid}>
          {memberStatuses.map((status, index) => (
            <View key={status.member.userId || index} style={styles.memberCell}>
              <View>
                <Avatar
                  src={status.member.user?.avatarUrl}
                  name={status.member.user?.displayName}
                  size="md"
                  status={status.hasSubmittedToday ? 'submitted' : 'pending'}
                />
              </View>
              <StreakCounter count={status.currentStreak} size="small" label="d" />
            </View>
          ))}
        </View>

        <Button
          label="Submit for Today"
          onPress={onSubmit}
          fullWidth
          trailingIcon="paper-plane-right"
        />
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
  headerEdge: {
    height: 4,
    width: '100%',
  },
  content: {
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 18,
  },
  memberCell: {
    alignItems: 'center',
    gap: 6,
    width: 64,
  },
});

export default ActivityCard;
