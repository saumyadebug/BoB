import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Modal, Pressable, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { COLORS, RADIUS, SHADOWS, EASE, DURATION } from '@/constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface BottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: number | 'auto' | 'half' | 'full';
}

export function BottomSheet({ isVisible, onClose, children, height = 'auto' }: BottomSheetProps) {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdrop = useSharedValue(0);
  const [mounted, setMounted] = React.useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setMounted(true);
      translateY.value = withSpring(0, { damping: 30, stiffness: 250, mass: 0.9 });
      backdrop.value = withTiming(1, { duration: DURATION.base, easing: Easing.out(Easing.cubic) });
    } else if (mounted) {
      translateY.value = withSpring(SCREEN_HEIGHT, { damping: 30, stiffness: 250, mass: 0.9 }, (done) => {
        if (done) runOnJS(setMounted)(false);
      });
      backdrop.value = withTiming(0, { duration: DURATION.base, easing: Easing.in(Easing.cubic) });
    }
  }, [isVisible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdrop.value,
  }));

  if (!mounted) return null;

  const sheetHeight =
    height === 'full' ? SCREEN_HEIGHT * 0.92 :
    height === 'half' ? SCREEN_HEIGHT * 0.55 :
    height === 'auto' ? undefined :
    height;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.kbWrapper}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              styles.sheet,
              SHADOWS.raisedLg,
              sheetHeight ? { height: sheetHeight } : null,
              sheetStyle,
            ]}
          >
            <View style={styles.handle} />
            {children}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: COLORS.bgOverlay,
  },
  kbWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.bgPanel,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: 24,
    paddingBottom: 36,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.hairlineStrong,
    alignSelf: 'center',
    marginBottom: 20,
  },
});

export default BottomSheet;
