import React, { useMemo, useState } from 'react';
import { View, FlatList, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import {
  FeedCard,
  TodayBanner,
  Text,
  Icon,
  Avatar,
  Skeleton,
  Card,
  Badge,
  Button,
} from '@/components/ui';
import { COLORS, RADIUS, SPACE } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { useCurrentUser, useUserGroups } from '@/hooks';
import { useUserStreaks } from '@/hooks/useStreaks';
import { useFeedSubmissions } from '@/hooks/useSubmissions';
import { TodayActivity } from '@/components/feed/TodayBanner';
import { submissionToFeedCard, FeedCardView } from '@/utils/feedAdapters';
import { IconName } from '@/components/ui/Icon';
import { useNavigation } from '@react-navigation/native';
import { Submission, Streak } from '@/types';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { isLoading: userLoading } = useCurrentUser();
  const { data: groups = [], isLoading: groupsLoading } = useUserGroups();
  const [feedFilter, setFeedFilter] = useState<'all' | 'mine'>('all');

  const groupIds = useMemo(() => groups.map(g => g.id), [groups]);

  const { data: allSubmissions = [], isLoading: feedLoading } = useFeedSubmissions(groupIds, 50);

  const topSubmissions = useMemo(() => {
    let list = allSubmissions.filter(s => typeof s.clientTimestamp === 'string');
    if (feedFilter === 'mine' && user?.id) {
      list = list.filter(s => s.userId === user.id);
    }
    return list.slice(0, 25);
  }, [allSubmissions, feedFilter, user?.id]);

  const todayDateISO = new Date().toISOString().slice(0, 10);
  const todaySubmissions = useMemo(
    () => allSubmissions
      .filter(s => typeof s.clientTimestamp === 'string' && s.clientTimestamp.slice(0, 10) === todayDateISO),
    [allSubmissions, todayDateISO]
  );

  const { data: streaks = [] } = useUserStreaks(user?.id ?? '');
  const streakByActivity = useMemo(() => {
    const m: Record<string, Streak> = {};
    streaks.forEach(s => { m[s.activityId] = s; });
    return m;
  }, [streaks]);

  const maxStreak = useMemo(() => {
    if (!streaks.length) return 0;
    return Math.max(...streaks.map(s => s.currentStreak || 0), 0);
  }, [streaks]);

  const groupNameById = useMemo(() => {
    const m: Record<string, string> = {};
    groups.forEach(g => { m[g.id] = g.name; });
    return m;
  }, [groups]);

  const todayBanner: TodayActivity[] = useMemo(
    () => topSubmissions.slice(0, 6).map(s => ({
      id: s.id,
      name: s.activity?.name ?? 'Activity',
      icon: (s.activity?.icon as IconName) || 'target',
      color: s.activity?.color ?? COLORS.accentRed,
      status: 'submitted',
    })),
    [topSubmissions]
  );

  const handleActivityPress = (_act: TodayActivity) => {
    navigation.navigate('Main', { screen: 'Groups' });
  };

  const renderItem = ({ item }: { item: Submission }) => {
    const view: FeedCardView = submissionToFeedCard(item, groupNameById);
    const streak = streakByActivity[item.activityId];
    if (streak) view.submission.streakCount = streak.currentStreak;
    return (
      <View style={styles.cardWrapper}>
        <FeedCard
          user={view.user}
          activity={view.activity}
          submission={view.submission}
        />
      </View>
    );
  };

  const renderEmpty = () => {
    if (userLoading || groupsLoading || feedLoading) {
      return (
        <View style={styles.empty}>
          <Card variant="glass" padding="lg" style={styles.emptyCard}>
            <Skeleton width="60%" height={20} borderRadius={4} />
            <View style={{ height: 12 }} />
            <Skeleton width="100%" height={160} borderRadius={16} />
            <View style={{ height: 12 }} />
            <Skeleton width="78%" height={14} borderRadius={4} />
          </Card>
        </View>
      );
    }
    return (
      <View style={styles.empty}>
        <Card variant="glass" padding="lg" style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <Icon name="fire" size={24} color={COLORS.accentRed} />
          </View>
          <Text variant="headingSm" color={COLORS.textPrimary} style={styles.emptyTitle}>
            No Proofs Yet Today
          </Text>
          <Text variant="bodySm" color={COLORS.textSecondary} style={styles.emptySub}>
            Complete your habits or cheer on your pact members to see activity here.
          </Text>
          <View style={{ height: 18 }} />
          <Button
            label="Explore Pacts"
            variant="pill"
            leadingIcon="users"
            onPress={() => navigation.navigate('Main', { screen: 'Groups' })}
          />
        </Card>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={topSubmissions}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <HomeHeader
            name={user?.displayName || 'User'}
            todayCount={todaySubmissions.length}
            totalGroups={groups.length}
            maxStreak={maxStreak}
            banner={todayBanner}
            feedFilter={feedFilter}
            setFeedFilter={setFeedFilter}
            onActivityPress={handleActivityPress}
            onExplorePress={() => navigation.navigate('Main', { screen: 'Groups' })}
          />
        }
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function HomeHeader({
  name,
  todayCount,
  totalGroups,
  maxStreak,
  banner,
  feedFilter,
  setFeedFilter,
  onActivityPress,
  onExplorePress,
}: {
  name: string;
  todayCount: number;
  totalGroups: number;
  maxStreak: number;
  banner: TodayActivity[];
  feedFilter: 'all' | 'mine';
  setFeedFilter: (f: 'all' | 'mine') => void;
  onActivityPress: (act: TodayActivity) => void;
  onExplorePress: () => void;
}) {
  const firstName = name.split(' ')[0] || 'there';

  return (
    <View style={styles.header}>
      {/* 1. Top Greeting & Profile Bar */}
      <View style={styles.topGreetingBar}>
        <View style={styles.greetingText}>
          <Text variant="caption" color={COLORS.textTertiary} style={styles.greetingEyebrow}>
            DAILY ACCOUNTABILITY
          </Text>
          <Text variant="displaySm" color={COLORS.textPrimary} style={styles.greetingTitle}>
            Hey, {firstName}
          </Text>
        </View>
        <Avatar name={name} size="md" />
      </View>

      {/* 2. Sleek Summary Stats Card (Black & Red Theme) */}
      <View style={styles.statsCard}>
        {/* Stat Item 1: Active Streak */}
        <View style={styles.statBox}>
          <View style={styles.statHeaderRow}>
            <View style={styles.statIconBadge}>
              <Icon name="fire" size={14} color={COLORS.accentRed} />
            </View>
            <Text variant="caption" color={COLORS.textSecondary}>Streak</Text>
          </View>
          <Text variant="monoMd" color={COLORS.textPrimary} style={styles.statVal}>
            {maxStreak > 0 ? `${maxStreak}d` : '0d'}
          </Text>
        </View>

        <View style={styles.statDivider} />

        {/* Stat Item 2: Today's Done */}
        <View style={styles.statBox}>
          <View style={styles.statHeaderRow}>
            <View style={[styles.statIconBadge, { backgroundColor: 'rgba(46, 157, 106, 0.15)' }]}>
              <Icon name="check" size={14} color={COLORS.positive} />
            </View>
            <Text variant="caption" color={COLORS.textSecondary}>Today</Text>
          </View>
          <Text variant="monoMd" color={COLORS.textPrimary} style={styles.statVal}>
            {todayCount} done
          </Text>
        </View>

        <View style={styles.statDivider} />

        {/* Stat Item 3: Total Pacts */}
        <Pressable onPress={onExplorePress} style={styles.statBox}>
          <View style={styles.statHeaderRow}>
            <View style={[styles.statIconBadge, { backgroundColor: 'rgba(58, 130, 247, 0.15)' }]}>
              <Icon name="users" size={14} color={COLORS.accentBlue} />
            </View>
            <Text variant="caption" color={COLORS.textSecondary}>Pacts</Text>
          </View>
          <Text variant="monoMd" color={COLORS.textPrimary} style={styles.statVal}>
            {totalGroups}
          </Text>
        </Pressable>
      </View>

      {/* 3. Today's Target Activities */}
      {banner.length > 0 && (
        <View style={styles.sectionWrap}>
          <TodayBanner activities={banner} onActivityPress={onActivityPress} />
        </View>
      )}

      {/* 4. Social Feed Section Header & Filter Pills */}
      <View style={styles.feedHeaderRow}>
        <View style={styles.feedTitleBlock}>
          <Text variant="headlineSm" color={COLORS.textPrimary}>
            Squad Proofs
          </Text>
          <Badge label="LIVE" variant="live" size="sm" pulse />
        </View>

        {/* Filter Pills */}
        <View style={styles.filterPills}>
          <Pressable
            onPress={() => setFeedFilter('all')}
            style={[
              styles.filterPill,
              feedFilter === 'all' ? styles.filterPillActive : styles.filterPillInactive,
            ]}
          >
            <Text
              variant="caption"
              color={feedFilter === 'all' ? '#FFFFFF' : COLORS.textTertiary}
              style={feedFilter === 'all' ? styles.filterTextActive : styles.filterTextInactive}
            >
              All Pacts
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setFeedFilter('mine')}
            style={[
              styles.filterPill,
              feedFilter === 'mine' ? styles.filterPillActive : styles.filterPillInactive,
            ]}
          >
            <Text
              variant="caption"
              color={feedFilter === 'mine' ? '#FFFFFF' : COLORS.textTertiary}
              style={feedFilter === 'mine' ? styles.filterTextActive : styles.filterTextInactive}
            >
              My Activity
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgBase,
  },
  listContent: {
    paddingBottom: 120,
  },
  cardWrapper: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  topGreetingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  greetingText: {
    flex: 1,
  },
  greetingEyebrow: {
    letterSpacing: 1.2,
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  greetingTitle: {
    letterSpacing: -0.5,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgPanel,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    alignItems: 'flex-start',
    paddingHorizontal: 4,
  },
  statHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  statIconBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 51, 75, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statVal: {
    fontSize: 16,
    lineHeight: 20,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.hairline,
    marginHorizontal: 8,
  },
  sectionWrap: {
    marginBottom: 16,
  },
  feedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  feedTitleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterPills: {
    flexDirection: 'row',
    gap: 6,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  filterPillActive: {
    backgroundColor: COLORS.accentRed,
  },
  filterPillInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterTextActive: {
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  filterTextInactive: {
    fontFamily: 'Inter-Medium',
  },
  empty: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 51, 75, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 51, 75, 0.30)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    marginBottom: 6,
  },
  emptySub: {
    textAlign: 'center',
    lineHeight: 18,
  },
});
