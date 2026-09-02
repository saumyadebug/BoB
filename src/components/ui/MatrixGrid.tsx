import React from 'react';
import { View, StyleSheet, Pressable, ViewStyle, StyleProp } from 'react-native';
import { Text } from './Text';
import { Icon, IconName } from './Icon';
import { COLORS, RADIUS, SPACE } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

export interface MatrixItem {
  id: string;
  dayLabel?: string;      // e.g. 'MON', 'TUE'
  value?: string | number;// e.g. '1', '2', '51%'
  subValue?: string;      // e.g. '3-4, 8-9'
  icon?: IconName;
  isActive?: boolean;     // e.g. current day or highlighted
  statusDot?: 'red' | 'blue' | 'none'; // pip at top right
  isMetric?: boolean;     // e.g. 51% ring dial cell
  metricValue?: number;   // 0-100
  disabled?: boolean;
}

export interface MatrixGridProps {
  days?: { label: string; active?: boolean }[];
  items: MatrixItem[];
  columns?: number;
  onItemPress?: (item: MatrixItem) => void;
  style?: StyleProp<ViewStyle>;
}

export function MatrixGrid({
  days = [
    { label: 'MON' },
    { label: 'TUE', active: true },
    { label: 'WED' },
    { label: 'THU' },
    { label: 'FRI' },
  ],
  items,
  columns = 5,
  onItemPress,
  style,
}: MatrixGridProps) {
  const handlePress = (item: MatrixItem) => {
    if (item.disabled) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onItemPress?.(item);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Day Headers Bar */}
      {days.length > 0 && (
        <View style={styles.daysRow}>
          {days.map((day, idx) => (
            <View
              key={idx}
              style={[
                styles.dayPill,
                day.active ? styles.dayPillActive : styles.dayPillInactive,
              ]}
            >
              <Text
                variant="caption"
                color={day.active ? '#FFFFFF' : COLORS.textTertiary}
                style={[styles.dayText, day.active && styles.dayTextActive]}
              >
                {day.label}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Squircle Grid Items */}
      <View style={styles.grid}>
        {items.map((item) => {
          const isItemActive = item.isActive;
          return (
            <Pressable
              key={item.id}
              onPress={() => handlePress(item)}
              style={({ pressed }) => [
                styles.tile,
                { width: `${(100 / columns) - 2}%` as any },
                item.isMetric && styles.metricTile,
                isItemActive && styles.tileActive,
                pressed && { opacity: 0.75, transform: [{ scale: 0.96 }] },
              ]}
              accessibilityRole="button"
            >
              {/* Status Pip Dot */}
              {item.statusDot === 'red' && <View style={[styles.pip, styles.pipRed]} />}
              {item.statusDot === 'blue' && <View style={[styles.pip, styles.pipBlue]} />}

              {/* Tile Content */}
              {item.isMetric ? (
                <View style={styles.metricContent}>
                  <View style={styles.metricDials}>
                    <View style={styles.dialBar} />
                    <View style={styles.dialBar} />
                    <View style={styles.dialBar} />
                  </View>
                  <Text variant="monoSm" color={COLORS.textPrimary} style={styles.metricText}>
                    {item.value || `${item.metricValue ?? 0}%`}
                  </Text>
                </View>
              ) : item.icon ? (
                <View style={styles.iconContent}>
                  <Icon name={item.icon} size={18} color={isItemActive ? COLORS.accentRed : COLORS.textSecondary} />
                  {item.value && (
                    <Text variant="caption" color={COLORS.textTertiary} style={styles.subText}>
                      {item.value}
                    </Text>
                  )}
                </View>
              ) : (
                <View style={styles.textContent}>
                  {item.subValue && (
                    <Text variant="caption" color={COLORS.textTertiary} style={styles.topSubText}>
                      {item.subValue}
                    </Text>
                  )}
                  <Text
                    variant="monoSm"
                    color={isItemActive ? '#FFFFFF' : COLORS.textSecondary}
                    style={styles.mainNumber}
                  >
                    {item.value}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bgPanel,
    borderRadius: RADIUS.radiusCard,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.hairline,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 6,
  },
  dayPill: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.pill,
  },
  dayPillActive: {
    backgroundColor: COLORS.accentRed,
  },
  dayPillInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  dayText: {
    fontSize: 10,
    letterSpacing: 0.5,
    fontFamily: 'Inter-Medium',
  },
  dayTextActive: {
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  tile: {
    aspectRatio: 1,
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.squircle,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    position: 'relative',
  },
  tileActive: {
    borderColor: COLORS.accentRed,
    backgroundColor: 'rgba(255, 51, 75, 0.10)',
  },
  metricTile: {
    aspectRatio: undefined,
    width: '38%' as any,
    minHeight: 56,
  },
  pip: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  pipRed: {
    backgroundColor: COLORS.accentRed,
  },
  pipBlue: {
    backgroundColor: COLORS.accentBlue,
  },
  textContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topSubText: {
    fontSize: 9,
    lineHeight: 11,
    color: COLORS.textTertiary,
    marginBottom: 2,
  },
  mainNumber: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: 'JetBrainsMono-Medium',
  },
  iconContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  subText: {
    fontSize: 9,
    fontFamily: 'JetBrainsMono-Regular',
    color: COLORS.textTertiary,
  },
  metricContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: '100%',
  },
  metricDials: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  dialBar: {
    width: 3,
    height: 14,
    borderRadius: 1.5,
    backgroundColor: COLORS.accentBlue,
    opacity: 0.7,
  },
  metricText: {
    fontSize: 15,
    fontFamily: 'JetBrainsMono-Bold',
  },
});

export default MatrixGrid;
