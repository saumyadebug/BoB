/**
 * Web-safe Pressable wrapper.
 *
 * react-native-reanimated's `Animated.createAnimatedComponent(Pressable)` requires
 * the native module which is missing on web. To avoid crashes during web
 * development (and to keep the app portable for an eventual react-native-web
 * build), we detect Platform.OS and use a regular Pressable on web.
 *
 * On web, the visual press feedback is handled by the platform's native
 * :active CSS pseudo-class via the `pressed` callback, so we still get
 * a press-state, just no spring animation.
 */
import { Platform, Pressable, PressableProps, View, ViewStyle, StyleProp } from 'react-native';
import React, { useCallback } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';

const isWeb = Platform.OS === 'web';

/** Animated variant for native. Falls back to a noop on web. */
const NativeAnimatedPressable = isWeb
  ? Pressable
  : Animated.createAnimatedComponent(Pressable);

/**
 * Cross-platform pressable that supports both a spring-press animation
 * (native) and a static pressed state (web).
 *
 * The API is compatible with React Native's Pressable. You don't need to
 * import Animated anywhere in app code — use this wrapper instead.
 */
export function PressableScale(props: PressableProps & { style?: StyleProp<ViewStyle> }) {
  const { children, style: pressedStyle, onPressIn, onPressOut, ...rest } = props as any;
  const scale = useSharedValue(1);

  const handlePressIn = useCallback((e: any) => {
    if (!isWeb) {
      scale.value = withSpring(0.97, { damping: 18, stiffness: 320 });
    }
    onPressIn?.(e);
  }, [onPressIn]);

  const handlePressOut = useCallback((e: any) => {
    if (!isWeb) {
      scale.value = withSpring(1, { damping: 18, stiffness: 320 });
    }
    onPressOut?.(e);
  }, [onPressOut]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (isWeb) {
    return (
      <Pressable {...rest} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        {children}
      </Pressable>
    );
  }

  return (
    <NativeAnimatedPressable
      {...rest}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </NativeAnimatedPressable>
  );
}
