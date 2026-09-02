import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { COLORS, RADIUS } from '@/constants/theme';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = RADIUS.sm, style }: SkeletonProps) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.cubic) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.55, 1]),
  }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: COLORS.bgSurface },
        animatedStyle,
        style,
      ]}
    />
  );
}

// Composed skeletons
export function FeedCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Skeleton width={44} height={44} borderRadius={22} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Skeleton width="55%" height={14} borderRadius={4} />
          <View style={{ height: 8 }} />
          <Skeleton width="35%" height={10} borderRadius={4} />
        </View>
      </View>
      <View style={{ height: 16 }} />
      <Skeleton width="100%" height={220} borderRadius={RADIUS.lg} />
      <View style={{ height: 14 }} />
      <Skeleton width="78%" height={14} borderRadius={4} />
      <View style={{ height: 8 }} />
      <Skeleton width="100%" height={12} borderRadius={4} />
      <View style={{ height: 6 }} />
      <Skeleton width="92%" height={12} borderRadius={4} />
    </View>
  );
}

export function GroupCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Skeleton width={48} height={48} borderRadius={24} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Skeleton width="60%" height={16} borderRadius={4} />
          <View style={{ height: 8 }} />
          <Skeleton width="40%" height={10} borderRadius={4} />
        </View>
      </View>
      <View style={{ height: 18 }} />
      <View style={styles.row}>
        <Skeleton width={32} height={32} borderRadius={16} style={{ marginRight: -8 }} />
        <Skeleton width={32} height={32} borderRadius={16} style={{ marginRight: -8 }} />
        <Skeleton width={32} height={32} borderRadius={16} style={{ marginRight: -8 }} />
        <View style={{ flex: 1 }} />
        <Skeleton width={70} height={22} borderRadius={RADIUS.pill} />
      </View>
    </View>
  );
}

export function CalendarRowSkeleton() {
  return (
    <View style={styles.calendarRow}>
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton key={i} width={36} height={36} borderRadius={RADIUS.sm} style={{ margin: 2 }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgPanel,
    borderRadius: RADIUS.lg,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.hairline,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
});

export default Skeleton;
