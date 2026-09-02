import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { TYPOGRAPHY, COLORS } from '@/constants/theme';

export type TextVariant =
  | 'displayLg' | 'displayMd' | 'displaySm'
  | 'headline' | 'headlineSm' | 'subheading'
  | 'headingLg' | 'headingMd' | 'headingSm'
  | 'body' | 'bodyMedium' | 'bodySm'
  | 'label' | 'caption' | 'eyebrow'
  | 'monoLg' | 'monoMd' | 'monoSm'
  | 'numericXl' | 'numericLg' | 'numericMd' | 'numericSm'
  | 'digitalDisplay';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  /**
   * Apply text-wrap balance where supported (web only).
   * No-op on native — kept for forward-compatibility.
   */
  balance?: boolean;
}

const numericVariants: TextVariant[] = [
  'numericXl', 'numericLg', 'numericMd', 'numericSm', 'digitalDisplay',
];

export function Text({
  variant = 'body',
  color,
  align = 'left',
  balance,
  style,
  children,
  ...rest
}: TextProps) {
  const baseStyle = TYPOGRAPHY[variant];
  const isNumeric = numericVariants.includes(variant);

  return (
    <RNText
      style={[
        baseStyle,
        { textAlign: align },
        isNumeric ? styles.numeric : null,
        color ? { color } : null,
        style,
      ]}
      allowFontScaling
      {...rest}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  numeric: {
    fontVariant: ['tabular-nums'],
  },
});

export default Text;
