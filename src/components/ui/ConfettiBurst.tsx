import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Confetti: brand-tinted, not rainbow. Single accent + 2 supporting tones.
const CONFETTI_COLORS = [
  COLORS.accentBlue,
  COLORS.accentHover,
  COLORS.textPrimary,
  COLORS.positive,
  '#FFB07A', // accent 200
  '#FFD0B0', // accent 100
];

interface ConfettiPieceProps {
  color: string;
  delay: number;
  startX: number;
  duration: number;
  drift: number;
  rotation: number;
  size: number;
  isRect: boolean;
}

function ConfettiPiece({ color, delay, startX, duration, drift, rotation, size, isRect }: ConfettiPieceProps) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 100 }));
    translateY.value = withDelay(delay, withTiming(SCREEN_HEIGHT * 0.75, {
      duration,
      easing: Easing.out(Easing.cubic),
    }));
    translateX.value = withDelay(delay, withTiming(drift, {
      duration,
      easing: Easing.inOut(Easing.cubic),
    }));
    rotate.value = withDelay(delay, withTiming(rotation, { duration }));
    opacity.value = withDelay(delay + duration * 0.7, withTiming(0, { duration: duration * 0.3 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: -20,
          left: startX,
          width: size,
          height: isRect ? size * 0.4 : size,
          backgroundColor: color,
          borderRadius: isRect ? 1.5 : size / 2,
        },
        animatedStyle,
      ]}
    />
  );
}

export interface ConfettiBurstProps {
  isVisible: boolean;
  pieceCount?: number;
}

export function ConfettiBurst({ isVisible, pieceCount = 50 }: ConfettiBurstProps) {
  const pieces = useMemo(() => {
    if (!isVisible) return [];
    return Array.from({ length: pieceCount }, (_, i) => ({
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: Math.random() * 400,
      startX: Math.random() * SCREEN_WIDTH,
      duration: 1800 + Math.random() * 600,
      drift: (Math.random() - 0.5) * 220,
      rotation: 540 + Math.random() * 540,
      size: 6 + Math.random() * 8,
      isRect: Math.random() > 0.5,
      _key: i,
    }));
  }, [isVisible, pieceCount]);

  if (!isVisible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {pieces.map((p) => (
        <ConfettiPiece key={p._key} {...p} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999,
    overflow: 'hidden',
  },
});

export default ConfettiBurst;
