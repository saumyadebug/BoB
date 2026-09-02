import React from 'react';
import { View, StyleSheet, FlatList, Pressable } from 'react-native';
import { Text } from './Text';
import { Avatar } from './Avatar';
import { Icon } from './Icon';
import { COLORS, RADIUS, SPACE, SHADOWS } from '@/constants/theme';

export interface StreakMember {
  id: string;
  name: string;
  avatarUrl?: string;
  streak: number;
  flameColor: string;
}

interface StreakSummaryBarProps {
  members: StreakMember[];
  onPressMember?: (memberId: string) => void;
  style?: any;
}

export function StreakSummaryBar({ members, onPressMember, style }: StreakSummaryBarProps) {
  const renderItem = ({ item }: { item: StreakMember }) => (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={() => onPressMember?.(item.id)}
    >
      <View style={[styles.glowBorder, { borderColor: item.flameColor + '40' }]} />
      <View style={styles.content}>
        <Avatar source={item.avatarUrl} size="md" fallback={item.name} />
        <Text variant="label" color={COLORS.inkDisplay} style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.streakBox}>
          <Text variant="caption" color={COLORS.inkTertiary}>Streak</Text>
          <View style={styles.flameRow}>
            <Icon name="zap" size={16} color={item.flameColor} />
          </View>
          <View style={styles.countRow}>
            <Text style={[styles.streakCount, { color: item.flameColor }]}>{item.streak}</Text>
            <Text variant="caption" color={COLORS.inkTertiary} style={styles.daysText}>DAYS</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, style]}>
      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: SPACE.md }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACE.lg,
  },
  listContent: {
    paddingHorizontal: SPACE.xl,
  },
  card: {
    width: 90,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  cardPressed: {
    backgroundColor: COLORS.surfaceSunken,
  },
  glowBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
  },
  content: {
    padding: SPACE.md,
    alignItems: 'center',
    width: '100%',
  },
  name: {
    marginTop: SPACE.sm,
    marginBottom: SPACE.md,
    textAlign: 'center',
  },
  streakBox: {
    alignItems: 'center',
    width: '100%',
    paddingTop: SPACE.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.hairline,
  },
  flameRow: {
    marginVertical: SPACE.xs,
  },
  countRow: {
    alignItems: 'center',
  },
  streakCount: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 20,
    lineHeight: 24,
  },
  daysText: {
    fontSize: 10,
    marginTop: -2,
  },
});
