import React, { useCallback } from 'react';
import { View, ViewProps, StyleSheet, Pressable, ViewStyle, StyleProp, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { COLORS, RADIUS, SHADOWS, SPACE } from '@/constants/theme';

type Variant = 'elevated' | 'flat' | 'outline' | 'sunken' | 'glass' | 'squircle';

export interface CardProps extends ViewProps {
  padding?: keyof typeof SPACE | number | 'none';
  variant?: Variant;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

const isWeb = Platform.OS === 'web';
// On web, fall back to a regular Pressable â€” Reanimated needs the native module.
const AnimatedPressable = isWeb ? Pressable : Animated.createAnimatedComponent(Pressable);

export function Card({
  padding = 'xl',
  variant = 'elevated',
  onPress,
  onLongPress,
  style,
  children,
  ...rest
}: CardProps) {
  const press = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    if (!onPress && !onLongPress) return;
    press.value = withSpring(1, { damping: 22, stiffness: 280 });
  }, [onPress, onLongPress, press]);

  const handlePressOut = useCallback(() => {
    if (!onPress && !onLongPress) return;
    press.value = withSpring(0, { damping: 22, stiffness: 280 });
  }, [onPress, onLongPress, press]);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(press.value, [0, 1], [1, 0.985]) }],
  }));

  const padValue = padding === 'none' ? 0 : (typeof padding === 'number' ? padding : (SPACE[padding as keyof typeof SPACE] ?? 0));

  const variantStyle = getVariantStyle(variant);

  const containerStyle = [
    styles.base,
    { padding: padValue },
    variantStyle,
    style,
  ];

  if (onPress || onLongPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[containerStyle, pressStyle]}
        accessibilityRole="button"
        {...(rest as any)}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <View style={containerStyle} {...rest}>
      {children}
    </View>
  );
}

function getVariantStyle(v: Variant) {
  switch (v) {
    case 'flat':
      return {
        backgroundColor: COLORS.bgPanel,
        borderWidth: 0,
        ...SHADOWS.none,
      } as const;
    case 'outline':
      return {
        backgroundColor: COLORS.bgPanel,
        borderWidth: 1,
        borderColor: COLORS.hairline,
        ...SHADOWS.none,
      } as const;
    case 'glass':
      return {
        backgroundColor: COLORS.bgGlass,
        borderWidth: 1,
        borderColor: COLORS.hairline,
        ...SHADOWS.none,
      } as const;
    case 'squircle':
      return {
        backgroundColor: COLORS.bgSurface,
        borderWidth: 1,
        borderColor: COLORS.hairline,
        borderRadius: RADIUS.squircle,
        ...SHADOWS.none,
      } as const;
    case 'sunken':
      return {
        backgroundColor: COLORS.bgSurface,
        borderWidth: 0,
        ...SHADOWS.none,
      } as const;
    case 'elevated':
    default:
      return {
        backgroundColor: COLORS.bgPanel,
        borderWidth: 1,
        borderColor: COLORS.hairline,
        ...SHADOWS.card,
      } as const;
  }
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.lg,
    width: '100%',
  },
});

export default Card;
