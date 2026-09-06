import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { COLORS, SHADOWS, RADIUS, TYPOGRAPHY } from '@/constants/theme';

export interface AvatarProps {
  source?: any;
  src?: string | null;
  url?: string | null;
  name?: string;
  size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  ring?: boolean;     // adds a hairline border
  status?: 'online' | 'away' | 'offline' | 'submitted' | 'pending' | 'rest' | 'missed';
  style?: any;
}

const SIZE_MAP: Record<string, number> = {
  xs: 24,
  sm: 32,
  md: 44,
  lg: 64,
  xl: 96,
  '2xl': 128,
};

const STATUS_COLOR: Record<string, string> = {
  online: COLORS.positive,
  submitted: COLORS.positive,
  away: COLORS.warning,
  pending: COLORS.warning,
  rest: COLORS.textTertiary,
  missed: COLORS.danger,
  offline: COLORS.textTertiary,
};

export function Avatar({
  source, src, url, name, size = 'md', ring = false, status, style,
}: AvatarProps) {
  const dimension = typeof size === 'number' ? size : SIZE_MAP[size] ?? 44;
  const rawImage = source || src || url;
  const imageSource = typeof rawImage === 'string' && rawImage.length > 0
    ? { uri: rawImage }
    : rawImage;

  // Initials for fallback
  const initials = name
    ? name.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase()).join('')
    : '';

  // Background tint seeded from name
  const bgColor = name ? hashColor(name) : COLORS.bgSurface;

  const containerStyle = [
    styles.container,
    {
      width: dimension,
      height: dimension,
      borderRadius: dimension / 2,
      backgroundColor: bgColor,
    },
    ring ? { borderWidth: 2, borderColor: COLORS.bgBase } : null,
    style,
  ];

  return (
    <View style={containerStyle}>
      {imageSource ? (
        <Image
          source={imageSource}
          style={{ width: dimension, height: dimension, borderRadius: dimension / 2 }}
        />
      ) : initials ? (
        <Text style={[styles.initials, { fontSize: dimension * 0.4 }]}>
          {initials}
        </Text>
      ) : (
        <View style={styles.empty} />
      )}
      {status ? (
        <View
          style={[
            styles.statusDot,
            {
              width: Math.max(8, dimension * 0.22),
              height: Math.max(8, dimension * 0.22),
              borderRadius: Math.max(4, dimension * 0.11),
              backgroundColor: STATUS_COLOR[status],
              right: 0,
              bottom: 0,
              borderWidth: Math.max(1.5, dimension * 0.04),
              borderColor: COLORS.bgBase,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

function hashColor(seed: string) {
  const palette = [
    '#FFE4D6', '#FFD6E0', '#E8DAFF', '#D6E4FF', '#D6F0FF',
    '#D6FFE4', '#FFF6D6', '#FFEFD6', '#F0D6FF',
  ];
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return palette[Math.abs(h) % palette.length];
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  initials: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  empty: {
    width: '60%',
    height: '60%',
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  statusDot: {
    position: 'absolute',
  },
});

export default Avatar;
