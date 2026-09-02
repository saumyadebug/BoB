import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { COLORS, RADIUS, TYPOGRAPHY } from '@/constants/theme';
import { Text } from './Text';
import { Icon, IconName } from './Icon';

type Variant = 'default' | 'primary' | 'secondary' | 'positive' | 'danger' | 'warning' | 'outline' | 'neutral';

export interface BadgeProps {
  label?: string;
  text?: string;
  icon?: IconName;
  variant?: Variant;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

export function Badge({
  label, text, icon, variant = 'default', size = 'md', style,
}: BadgeProps) {
  const displayLabel = label || text || '';
  const { bg, fg, border } = paletteFor(variant);
  const isSm = size === 'sm';
  const iconSize = isSm ? 11 : 13;

  return (
    <View
      style={[
        styles.container,
        isSm ? styles.containerSm : null,
        {
          backgroundColor: bg,
          borderColor: border,
        },
        style,
      ]}
    >
      {icon ? (
        <Icon name={icon} size={iconSize} color={fg} />
      ) : null}
      {displayLabel ? (
        <Text
          variant={isSm ? 'caption' : 'label'}
          color={fg}
          style={styles.label}
        >
          {displayLabel}
        </Text>
      ) : null}
    </View>
  );
}

function paletteFor(v: Variant) {
  switch (v) {
    case 'primary':   return { bg: COLORS.accent, fg: '#FFFFFF', border: 'transparent' };
    case 'secondary': return { bg: COLORS.surfaceSunken, fg: COLORS.inkPrimary, border: 'transparent' };
    case 'positive':  return { bg: COLORS.positiveTint, fg: COLORS.positive, border: 'transparent' };
    case 'danger':    return { bg: COLORS.dangerTint, fg: COLORS.danger, border: 'transparent' };
    case 'warning':   return { bg: COLORS.warningTint, fg: COLORS.warning, border: 'transparent' };
    case 'outline':   return { bg: 'transparent', fg: COLORS.inkPrimary, border: COLORS.hairlineStrong };
    case 'neutral':   return { bg: COLORS.surfaceSunken, fg: COLORS.inkPrimary, border: 'transparent' };
    case 'default':
    default:          return { bg: COLORS.surfaceSunken, fg: COLORS.inkPrimary, border: 'transparent' };
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
    gap: 5,
  },
  containerSm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Inter-SemiBold',
  },
});

export default Badge;
