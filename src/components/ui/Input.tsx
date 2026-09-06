import React, { useState, useCallback } from 'react';
import {
  TextInput,
  TextInputProps,
  StyleSheet,
  View,
  StyleProp,
  ViewStyle,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { COLORS, RADIUS, SPACE, TYPOGRAPHY } from '@/constants/theme';
import { Text } from './Text';
import { Icon, IconName } from './Icon';

export interface InputProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  leadingIcon?: IconName;
  trailingIcon?: IconName;
  onTrailingIconPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  showCharCount?: boolean;
}

export function Input({
  label,
  hint,
  error,
  leadingIcon,
  trailingIcon,
  onTrailingIconPress,
  containerStyle,
  style,
  onFocus,
  onBlur,
  secureTextEntry,
  showCharCount,
  ...rest
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(!!secureTextEntry);
  const focus = useSharedValue(0);

  const handleFocus = useCallback((e: any) => {
    setIsFocused(true);
    focus.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) });
    onFocus?.(e);
  }, [focus, onFocus]);

  const handleBlur = useCallback((e: any) => {
    setIsFocused(false);
    focus.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.cubic) });
    onBlur?.(e);
  }, [focus, onBlur]);

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: error
      ? COLORS.danger
      : focus.value > 0.5
        ? COLORS.textPrimary
        : COLORS.hairlineStrong,
    borderWidth: focus.value > 0.5 ? 1.5 : 1,
  }));

  const showTrailing = trailingIcon || secureTextEntry;
  const trailingIconName: IconName | undefined = secureTextEntry
    ? (isSecure ? 'eye' : 'eye-slash')
    : trailingIcon;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text variant="label" style={styles.label}>{label}</Text>
      ) : null}
      <Animated.View style={[styles.inputContainer, borderStyle]}>
        {leadingIcon ? (
          <View style={styles.iconLeading}>
            <Icon name={leadingIcon} size={20} color={isFocused ? COLORS.textPrimary : COLORS.textTertiary} />
          </View>
        ) : null}
        <TextInput
          style={[
            styles.input,
            leadingIcon ? { paddingLeft: 0 } : null,
            showTrailing ? { paddingRight: 0 } : null,
            style,
          ]}
          placeholderTextColor={COLORS.textTertiary}
          selectionColor={COLORS.accentBlue}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={isSecure}
          {...rest}
        />
        {showTrailing ? (
          <Pressable
            onPress={() => {
              if (secureTextEntry) setIsSecure(s => !s);
              else onTrailingIconPress?.();
            }}
            style={styles.iconTrailing}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={secureTextEntry ? (isSecure ? 'Show password' : 'Hide password') : undefined}
          >
            {trailingIconName ? (
              <Icon name={trailingIconName} size={20} color={COLORS.textTertiary} />
            ) : null}
          </Pressable>
        ) : null}
      </Animated.View>
      <View style={styles.messageRow}>
        <View style={{ flex: 1 }}>
          {error ? (
            <Text variant="caption" color={COLORS.danger} style={styles.message}>
              {error}
            </Text>
          ) : hint ? (
            <Text variant="caption" color={COLORS.textSecondary} style={styles.message}>
              {hint}
            </Text>
          ) : null}
        </View>
        {showCharCount && rest.maxLength ? (
          <Text variant="caption" color={COLORS.textTertiary} style={styles.charCount}>
            {`${String(rest.value || '').length}/${rest.maxLength}`}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: 8,
    color: COLORS.textPrimary,
  },
  inputContainer: {
    backgroundColor: COLORS.bgPanel,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
  },
  input: {
    ...TYPOGRAPHY.body,
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.textPrimary,
  },
  iconLeading: {
    paddingLeft: 16,
    paddingRight: 10,
  },
  iconTrailing: {
    paddingRight: 16,
    paddingLeft: 10,
    height: '100%',
    justifyContent: 'center',
  },
  message: {
    marginTop: 6,
    marginLeft: 2,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  charCount: {
    marginTop: 6,
    marginRight: 2,
  },
});

export default Input;
