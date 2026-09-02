import React, { useCallback } from 'react';
import { Pressable, View, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Icon, IconName } from '@/components/ui/Icon';
import { StackedAvatars } from './StackedAvatars';
import { COLORS, RADIUS, SHADOWS } from '@/constants/theme';

export interface GroupCardProps {
  id: string;
  name: string;
  icon: IconName;
  iconColor: string;
  members: Array<{ avatarUrl?: string | null; displayName?: string }>;
  activitiesCount: number;
  allSubmitted: boolean;
  streakDays: number;
  onPress: () => void;
  onLongPress?: () => void;
}

const isWeb = Platform.OS === 'web';
const AnimatedPressable = isWeb ? Pressable : Animated.createAnimatedComponent(Pressable);

export function GroupCard({
  name,
  icon,
  iconColor,
  members,
  activitiesCount,
  allSubmitted,
  streakDays,
  onPress,
  onLongPress,
}: GroupCardProps) {
  const press = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    press.value = withSpring(1, { damping: 22, stiffness: 320 });
  }, [press]);

  const handlePressOut = useCallback(() => {
    press.value = withSpring(0, { damping: 22, stiffness: 320 });
  }, [press]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(press.value, [0, 1], [1, 0.985]) }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      delayLongPress={400}
      style={animStyle}
    >
      <Card variant="elevated" padding="lg">
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={[styles.iconBox, { backgroundColor: hexToTint(iconColor) }]}>
            <Icon name={icon} size={24} color={iconColor} />
          </View>
          <View style={styles.titleArea}>
            <Text variant="headingMd" color={COLORS.textPrimary} numberOfLines={1}>
              {name}
            </Text>
            <Text variant="caption" color={COLORS.textSecondary}>
              {activitiesCount} {activitiesCount === 1 ? 'activity' : 'activities'}
            </Text>
          </View>
          <View style={styles.statusCol}>
            {allSubmitted ? (
              <Badge label="All done" icon="check-circle" variant="positive" />
            ) : (
              <Badge label="In progress" variant="neutral" />
            )}
          </View>
        </View>

        {/* Footer row */}
        <View style={styles.footerRow}>
          <StackedAvatars
            avatars={members.map(m => m.avatarUrl ?? null)}
            names={members.map(m => m.displayName ?? 'Member')}
            max={4}
            size={28}
          />
          <View style={styles.streakPill}>
            <Icon name="flame" size={14} color={COLORS.accentBlue} />
            <Text variant="numericSm" color={COLORS.textPrimary}>
              {streakDays}
            </Text>
            <Text variant="caption" color={COLORS.textTertiary}>d</Text>
          </View>
        </View>
      </Card>
    </AnimatedPressable>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleArea: {
    flex: 1,
  },
  statusCol: {
    alignItems: 'flex-end',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSurface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    gap: 4,
  },
});

export default GroupCard;
