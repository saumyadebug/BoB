import React, { useCallback } from 'react';
import { Pressable, StyleSheet, ViewStyle, StyleProp, View, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { COLORS, RADIUS } from '@/constants/theme';
import { Text } from './Text';
import { Icon, IconName } from './Icon';
import * as Haptics from 'expo-haptics';

const isWeb = Platform.OS === 'web';
const AnimatedPressable = isWeb ? Pressable : Animated.createAnimatedComponent(Pressable);

export interface ChipProps {
  label: string;
  icon?: IconName;
  isSelected?: boolean;
  onPress?: () => void;
  variant?: 'default' | 'accent';
  style?: StyleProp<ViewStyle>;
}

export function Chip({ label, icon, isSelected = false, onPress, variant = 'default', style }: ChipProps) {
  const press = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    press.value = withSpring(1, { damping: 18, stiffness: 320 });
  }, [press]);

  const handlePressOut = useCallback(() => {
    press.value = withSpring(0, { damping: 18, stiffness: 320 });
  }, [press]);

  const handlePress = useCallback(() => {
    try { Haptics.selectionAsync(); } catch {}
    onPress?.();
  }, [onPress]);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(press.value, [0, 1], [1, 0.96]) }],
  }));

  const isAccent = variant === 'accent';
  const selected = isSelected || isAccent;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        {
          backgroundColor: selected ? COLORS.textPrimary : COLORS.bgPanel,
          borderColor: selected ? COLORS.textPrimary : COLORS.hairline,
        },
        style,
        pressStyle,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      {icon ? (
        <Icon
          name={icon}
          size={15}
          color={selected ? COLORS.bgBase : COLORS.textPrimary}
        />
      ) : null}
      <Text
        variant="label"
        color={selected ? COLORS.bgBase : COLORS.textPrimary}
        style={styles.label}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
    gap: 6,
  },
  label: {
    fontSize: 14,
    lineHeight: 18,
  },
});

export default Chip;
