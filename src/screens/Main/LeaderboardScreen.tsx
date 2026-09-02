import React, { useMemo } from 'react';
import { View, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import { Text, Avatar, Card, Icon, Skeleton } from '@/components/ui';
import { COLORS, RADIUS } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { useMyGroupMembers } from '@/hooks';

const RANK_COLORS: Record<number, string> = {
  1: '#FBBF24',
  2: '#9CA3AF',
  3: '#B45309',
};

export default function LeaderboardScreen() {
  const { user } = useAuthStore();
  const { data: entries = [], isLoading } = useMyGroupMembers();

  // Sort by XP desc, then by display name for stable ordering
  const ranked = useMemo(() => {
    return [...entries]
      .sort((a, b) => b.xp - a.xp || a.displayName.localeCompare(b.displayName))
      .map((e, i) => ({ ...e, rank: i + 1 }));
  }, [entries]);

  const maxXp = ranked[0]?.xp ?? 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text variant="eyebrow" color={COLORS.textSecondary}>This month</Text>
        <Text variant="displaySm" color={COLORS.textPrimary} style={styles.title}>
          Leaderboard
        </Text>
        <Text variant="body" color={COLORS.textSecondary} style={styles.subtitle}>
          {ranked.length > 0
            ? `${ranked.length} ${ranked.length === 1 ? 'pact member' : 'pact members'} ranked by XP.`
            : "Join a pact to start the leaderboard."}
        </Text>
      </View>

      {isLoading ? (
        <View style={{ paddingHorizontal: 16 }}>
          {[0, 1, 2].map(i => (
            <View key={i} style={styles.skeletonRow}>
              <Skeleton width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Skeleton width="60%" height={14} borderRadius={4} />
                <View style={{ height: 6 }} />
                <Skeleton width="40%" height={10} borderRadius={4} />
              </View>
            </View>
          ))}
        </View>
      ) : ranked.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="headingSm" color={COLORS.textPrimary} style={styles.emptyTitle}>
            No pacts yet
          </Text>
          <Text variant="bodySm" color={COLORS.textSecondary} style={{ textAlign: 'center' }}>
            Join a pact to see who else is showing up.
          </Text>
        </View>
      ) : (
        <FlatList
          data={ranked}
          keyExtractor={item => item.userId}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <Row item={item} maxXp={maxXp} isYou={item.userId === user?.id} />}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}
    </SafeAreaView>
  );
}

function Row({ item, maxXp, isYou }: { item: any; maxXp: number; isYou: boolean }) {
  const fill = maxXp > 0 ? (item.xp / maxXp) * 100 : 0;
  const rankColor = RANK_COLORS[item.rank] ?? COLORS.textTertiary;
  const isTop3 = item.rank <= 3;

  return (
    <Card
      variant={isYou ? 'elevated' : 'flat'}
      padding="lg"
      style={isYou ? styles.you : null}
    >
      <View style={styles.row}>
        <View style={[styles.rankBox, { backgroundColor: hexToTint(rankColor, 0.14) }]}>
          {isTop3 ? (
            <Icon name="crown" size={20} color={rankColor} bold />
          ) : (
            <Text variant="numericMd" color={COLORS.textPrimary}>{item.rank}</Text>
          )}
        </View>
        <Avatar src={item.avatarUrl} name={item.displayName} size="md" />
        <View style={styles.userInfo}>
          <Text variant="headingSm" color={COLORS.textPrimary} numberOfLines={1}>
            {isYou ? 'You' : item.displayName}
          </Text>
          <Text variant="caption" color={COLORS.textSecondary} numberOfLines={1}>
            @{item.username} · {item.groupName}
          </Text>
        </View>
        <View style={styles.xpBox}>
          <Text variant="numericMd" color={COLORS.textPrimary}>{item.xp.toLocaleString()}</Text>
          <Text variant="caption" color={COLORS.textTertiary}>XP</Text>
        </View>
      </View>

      <View style={styles.barBg}>
        <View
          style={[
            styles.barFill,
            {
              width: `${fill}%`,
              backgroundColor: isYou ? COLORS.accentBlue : COLORS.positive,
            },
          ]}
        />
      </View>
    </Card>
  );
}

function hexToTint(hex: string, alpha: number) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bgBase },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  title: { marginTop: 4 },
  subtitle: { marginTop: 6, lineHeight: 22 },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  rankBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: { flex: 1 },
  xpBox: {
    alignItems: 'flex-end',
  },
  barBg: {
    height: 6,
    backgroundColor: COLORS.bgSurface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  you: {
    borderWidth: 1.5,
    borderColor: COLORS.accentBlue,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: { marginBottom: 8, textAlign: 'center' },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
});
