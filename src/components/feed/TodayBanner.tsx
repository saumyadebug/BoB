import React from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Text } from '../ui/Text';
import { Icon, IconName } from '../ui/Icon';
import { COLORS, RADIUS, SHADOWS } from '@/constants/theme';

export type TodayStatus = 'pending' | 'submitted' | 'rest' | 'missed';

export interface TodayActivity {
  id: string;
  name: string;
  icon: IconName;
  color: string;
  status: TodayStatus;
}

interface TodayBannerProps {
  activities: TodayActivity[];
  onActivityPress: (activity: TodayActivity) => void;
}

/**
 * Horizontal scroll of today's pact activities.
 * - Pill shape with activity color tint
 * - Small status dot (color only â€” paired with label for a11y)
 * - Tap = direct submission
 */
export function TodayBanner({ activities, onActivityPress }: TodayBannerProps) {
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text variant="eyebrow" color={COLORS.textSecondary}>Today</Text>
        <Text variant="caption" color={COLORS.textTertiary}>
          {activities.filter(a => a.status === 'submitted').length}/{activities.length} done
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activities.map(act => (
          <Pressable
            key={act.id}
            onPress={() => onActivityPress(act)}
            style={({ pressed }) => [
              styles.pill,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${act.name}, ${act.status === 'submitted' ? 'submitted' : act.status === 'pending' ? 'pending' : 'rest day'}`}
          >
            <View style={[styles.iconWrap, { backgroundColor: hexToTint(act.color) }]}>
              <Icon name={act.icon} size={20} color={act.color} />
            </View>
            <View style={styles.pillText}>
              <Text variant="label" color={COLORS.textPrimary} numberOfLines={1}>{act.name}</Text>
              <Text variant="caption" color={statusColor(act.status)}>
                {statusLabel(act.status)}
              </Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: statusColor(act.status) }]} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function statusColor(s: TodayStatus) {
  switch (s) {
    case 'submitted': return COLORS.positive;
    case 'pending':   return COLORS.accentRed;
    case 'missed':    return COLORS.danger;
    case 'rest':      return COLORS.textTertiary;
  }
}

function statusLabel(s: TodayStatus) {
  switch (s) {
    case 'submitted': return 'Done';
    case 'pending':   return 'Pending';
    case 'missed':    return 'Missed';
    case 'rest':      return 'Rest';
  }
}

function hexToTint(hex: string, alpha: number = 0.14) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  scrollContent: {
    paddingHorizontal: 24,
    gap: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgPanel,
    paddingLeft: 8,
    paddingRight: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    justifyContent: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default TodayBanner;
