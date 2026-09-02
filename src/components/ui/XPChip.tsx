import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
  withTiming,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { COLORS, RADIUS, SHADOWS } from '@/constants/theme';
import { Text } from './Text';
import { Icon, IconName } from './Icon';

export interface XPChipProps {
  xp: number;
  icon?: IconName;
  onAnimationEnd?: () => void;
}

export function XPChip({ xp, icon = 'lightning', onAnimationEnd }: XPChipProps) {
  const translateY = useSharedValue(40);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.85);

  useEffect(() => {
    translateY.value = withSequence(
      withSpring(0, { damping: 12, stiffness: 200 }),
      withDelay(1400, withTiming(-100, { duration: 350, easing: Easing.in(Easing.cubic) }))
    );
    opacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withDelay(1400, withTiming(0, { duration: 350 }, (finished) => {
        if (finished && onAnimationEnd) runOnJS(onAnimationEnd)();
      }))
    );
    scale.value = withSpring(1, { damping: 12, stiffness: 220 });
  }, [xp]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.chip, animatedStyle, SHADOWS.cta]} pointerEvents="none">
      <View style={styles.inner}>
        <Icon name={icon} size={20} color="#FFFFFF" />
        <Text variant="headingSm" color="#FFFFFF" style={styles.text}>
          +{xp} XP
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: COLORS.accentBlue,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: RADIUS.pill,
    zIndex: 1000,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    letterSpacing: 0.2,
  },
});

export default XPChip;
