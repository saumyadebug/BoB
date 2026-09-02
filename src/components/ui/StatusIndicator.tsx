import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/theme';

export type StatusType = 'pending' | 'submitted' | 'missed' | 'rest' | 'active';

export interface StatusIndicatorProps {
  status: StatusType;
  size?: number;
  withRing?: boolean;
}

const STATUS_COLOR: Record<StatusType, string> = {
  pending: COLORS.textTertiary,
  submitted: COLORS.positive,
  missed: COLORS.danger,
  rest: '#A5A5AA',
  active: COLORS.accentBlue,
};

const STATUS_GLOW: Record<StatusType, string> = {
  pending: 'transparent',
  submitted: COLORS.positive,
  missed: COLORS.danger,
  rest: 'transparent',
  active: COLORS.accentBlue,
};

export function StatusIndicator({ status, size = 12, withRing = false }: StatusIndicatorProps) {
  const color = STATUS_COLOR[status];
  const glow = STATUS_GLOW[status];

  return (
    <View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          shadowColor: glow,
          shadowOpacity: glow === 'transparent' ? 0 : 0.6,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 0 },
        },
        withRing
          ? {
              borderWidth: 2,
              borderColor: COLORS.bgBase,
            }
          : null,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    // base
  },
});

export default StatusIndicator;
