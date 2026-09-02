import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { COLORS, RADIUS } from '@/constants/theme';
import { Text } from './Text';
import { Icon, IconName } from './Icon';

export interface StreakCounterProps {
  count: number;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  icon?: IconName;
  variant?: 'default' | 'accent';
}

/**
 * The streak number rendered in a recessed "LCD" plate.
 * Real depth: dark inner background + soft inner highlight at top.
 */
export function StreakCounter({ count, label = 'Day Streak', size = 'medium', icon = 'flame', variant = 'accent' }: StreakCounterProps) {
  const scale = useSharedValue(1);
  const flash = useSharedValue(0);

  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.08, { damping: 6, stiffness: 250 }),
      withSpring(1, { damping: 12, stiffness: 200 })
    );
    flash.value = withSequence(
      withTiming(1, { duration: 80 }),
      withTiming(0, { duration: 360, easing: Easing.out(Easing.cubic) })
    );
  }, [count]);

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flash.value,
  }));

  const isSmall = size === 'small';
  const isLarge = size === 'large';

  const iconSize = isSmall ? 14 : isLarge ? 26 : 18;
  const numVariant: any = isSmall ? 'numericSm' : isLarge ? 'numericLg' : 'numericMd';
  const numFontSize = isSmall ? 14 : isLarge ? 28 : 18;

  return (
    <Animated.View style={[styles.screen, isSmall && styles.screenSm, isLarge && styles.screenLg, scaleStyle]}>
      <View style={styles.inner}>
        <Icon
          name={icon}
          size={iconSize}
          color={variant === 'accent' ? COLORS.accentBlue : COLORS.textPrimary}
        />
        <Text
          variant={numVariant}
          color={variant === 'accent' ? COLORS.accentBlue : COLORS.textPrimary}
          style={{ fontSize: numFontSize, lineHeight: numFontSize * 1.1 }}
        >
          {count}
        </Text>
        {!isSmall && (
          <Text
            variant="caption"
            color={COLORS.textTertiary}
            style={styles.label}
          >
            {label}
          </Text>
        )}
      </View>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.flash,
          flashStyle,
        ]}
        pointerEvents="none"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    // Subtle inner top highlight
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.6)',
  },
  screenSm: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  screenLg: {
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginLeft: 2,
  },
  flash: {
    backgroundColor: 'rgba(255, 91, 31, 0.10)',
    borderRadius: RADIUS.md,
  },
});

export default StreakCounter;
