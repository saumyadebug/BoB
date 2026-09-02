import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { COLORS, RADIUS, TYPOGRAPHY } from '@/constants/theme';
import { Text } from './Text';
import { Icon, IconName } from './Icon';

type Variant = 'default' | 'primary' | 'secondary' | 'positive' | 'danger' | 'warning' | 'outline' | 'neutral' | 'live' | 'signal' | 'pill';

export interface BadgeProps {
  label?: string;
  text?: string;
  icon?: IconName;
  variant?: Variant;
  size?: 'sm' | 'md';
  pulse?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Badge({
  label, text, icon, variant = 'default', size = 'md', pulse = false, style,
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
      {(variant === 'live' || pulse) && (
        <View style={styles.liveDot} />
      )}
      {icon ? (
        <Icon name={icon} size={iconSize} color={fg} />
      ) : null}
      {displayLabel ? (
        <Text
          variant={isSm ? 'caption' : 'label'}
          color={fg}
          style={[styles.label, variant === 'live' && styles.liveLabel]}
        >
          {displayLabel}
        </Text>
      ) : null}
    </View>
  );
}

function paletteFor(v: Variant) {
  switch (v) {
    case 'live':
    case 'signal':    return { bg: COLORS.accentRed, fg: '#FFFFFF', border: 'transparent' };
    case 'pill':      return { bg: 'rgba(255,255,255,0.06)', fg: COLORS.textSecondary, border: 'rgba(255,255,255,0.10)' };
    case 'primary':   return { bg: COLORS.accentBlue, fg: '#FFFFFF', border: 'transparent' };
    case 'secondary': return { bg: COLORS.bgSurface, fg: COLORS.textPrimary, border: 'transparent' };
    case 'positive':  return { bg: 'rgba(46, 157, 106, 0.14)', fg: COLORS.positive, border: 'transparent' };
    case 'danger':    return { bg: 'rgba(255, 51, 75, 0.14)', fg: COLORS.danger, border: 'transparent' };
    case 'warning':   return { bg: 'rgba(245, 158, 11, 0.14)', fg: COLORS.warning, border: 'transparent' };
    case 'outline':   return { bg: 'transparent', fg: COLORS.textPrimary, border: COLORS.hairlineStrong };
    case 'neutral':   return { bg: COLORS.bgSurface, fg: COLORS.textPrimary, border: 'transparent' };
    case 'default':
    default:          return { bg: COLORS.bgSurface, fg: COLORS.textPrimary, border: 'transparent' };
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
  liveLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginRight: 2,
  },
});

export default Badge;
