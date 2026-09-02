import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Text } from '@/components/ui/Text';
import { COLORS } from '@/constants/theme';

interface StackedAvatarsProps {
  avatars: Array<string | null | undefined>;
  names?: string[];
  max?: number;
  size?: number;
}

export function StackedAvatars({ avatars, names = [], max = 3, size = 32 }: StackedAvatarsProps) {
  const display = avatars.slice(0, max);
  const remaining = Math.max(0, avatars.length - max);

  return (
    <View style={styles.container}>
      {display.map((a, i) => (
        <View
          key={i}
          style={[
            styles.avatarWrap,
            { marginLeft: i === 0 ? 0 : -(size * 0.32) },
          ]}
        >
          <Avatar
            src={a ?? undefined}
            name={names[i]}
            size={size}
            ring
          />
        </View>
      ))}
      {remaining > 0 && (
        <View
          style={[
            styles.moreContainer,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: -(size * 0.32),
              borderWidth: 2,
              borderColor: COLORS.bgBase,
            },
          ]}
        >
          <Text variant="numericSm" color={COLORS.textPrimary}>
            +{remaining}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    // overlap handled by margin
  },
  moreContainer: {
    backgroundColor: COLORS.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default StackedAvatars;
