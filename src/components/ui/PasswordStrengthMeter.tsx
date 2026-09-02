import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './Text';
import { COLORS, RADIUS } from '@/constants/theme';
import { PasswordStrength } from '@/validation/auth';

interface PasswordStrengthMeterProps {
  strength: PasswordStrength;
  label: string;
}

/**
 * 4-segment password strength indicator. Color goes gray → orange → green.
 */
export function PasswordStrengthMeter({ strength, label }: PasswordStrengthMeterProps) {
  const filledIndex =
    strength === 'weak' ? 1 : strength === 'fair' ? 2 : strength === 'strong' || strength === 'excellent' ? 4 : 0;

  const color =
    strength === 'weak' ? COLORS.danger :
    strength === 'fair' ? COLORS.warning :
    strength === 'strong' || strength === 'excellent' ? COLORS.positive :
    COLORS.hairline;

  return (
    <View style={styles.wrap}>
      <View style={styles.bars}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.bar,
              { backgroundColor: i < filledIndex ? color : COLORS.hairline },
            ]}
          />
        ))}
      </View>
      <Text variant="caption" color={color} style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bars: {
    flexDirection: 'row',
    flex: 1,
    gap: 4,
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: RADIUS.xs,
  },
  label: {
    minWidth: 70,
    textAlign: 'right',
  },
});
