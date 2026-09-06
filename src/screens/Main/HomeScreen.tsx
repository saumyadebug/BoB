import React, { useState } from 'react';
import { View, FlatList, StyleSheet, SafeAreaView, Pressable, RefreshControl, ScrollView } from 'react-native';
import { Text, Icon, Avatar, Badge, Button } from '@/components/ui';
import { COLORS, RADIUS, SPACE } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { useMockFeed, MockFeedItem } from '@/hooks/useMockFeed';
import { useUserGroups } from '@/hooks';
import { FeedCard } from '@/components/ui/FeedCard';
import { TodayBanner } from '@/components/ui/TodayBanner';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const [feedFilter, setFeedFilter] = useState<'all' | 'mine'>('all');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const { data: userGroups = [] } = useUserGroups();
  
  // Use our new mock hook for Phase 7 UI build-out
  const { data: allSubmissions, isLoading: feedLoading, refetch } = useMockFeed();

  const topSubmissions = React.useMemo(() => {
    let list = allSubmissions;
    if (feedFilter === 'mine' && user?.id) {
      list = list.filter(s => s.userId === user.id);
    }
    if (selectedGroupId) {
      list = list.filter(s => s.groupId === selectedGroupId);
    }
    return list;
  }, [allSubmissions, feedFilter, selectedGroupId, user?.id]);

  const renderItem = ({ item }: { item: MockFeedItem }) => {
    return (
      <View style={styles.cardWrapper}>
        <FeedCard item={item} />
      </View>
    );
  };

  const renderEmpty = () => {
    return (
      <View style={styles.empty}>
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
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={topSubmissions}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <HomeHeader
              name={user?.displayName || 'Mark'}
              avatarUrl={user?.avatarUrl}
              pactsCount={userGroups.length}
              feedFilter={feedFilter}
              setFeedFilter={setFeedFilter}
            />
            <TodayBanner />
            <View style={styles.feedHeaderRow}>
              <View style={styles.feedTitleBlock}>
                <Text variant="headingSm" color={COLORS.textPrimary}>
                  Squad Proofs
                </Text>
                <Badge label="LIVE" variant="live" size="sm" pulse />
              </View>
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
                  >
                    My Activity
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Horizontal Squad Selector Pills */}
            {userGroups.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.groupFilterScroll}
              >
                <Pressable
                  onPress={() => setSelectedGroupId(null)}
                  style={[
                    styles.groupFilterChip,
                    selectedGroupId === null
                      ? styles.groupFilterChipActive
                      : styles.groupFilterChipInactive,
                  ]}
                >
                  <Text
                    variant="caption"
                    color={selectedGroupId === null ? '#FFFFFF' : COLORS.textSecondary}
                    style={styles.groupFilterText}
                  >
                    ✨ All Squads
                  </Text>
                </Pressable>
                {userGroups.map((group) => {
                  const isSelected = selectedGroupId === group.id;
                  return (
                    <Pressable
                      key={group.id}
                      onPress={() => setSelectedGroupId(isSelected ? null : group.id)}
                      style={[
                        styles.groupFilterChip,
                        isSelected
                          ? styles.groupFilterChipActive
                          : styles.groupFilterChipInactive,
                      ]}
                    >
                      <Text
                        variant="caption"
                        color={isSelected ? '#FFFFFF' : COLORS.textSecondary}
                        style={styles.groupFilterText}
                      >
                        {group.emoji || '⚡'} {group.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </>
        }
        renderItem={renderItem}
        ListEmptyComponent={!feedLoading ? renderEmpty : null}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={feedLoading} 
            onRefresh={refetch}
            tintColor={COLORS.accentBlue}
          />
        }
      />
    </SafeAreaView>
  );
}

function HomeHeader({
  name,
  avatarUrl,
  pactsCount,
  feedFilter,
  setFeedFilter,
}: {
  name: string;
  avatarUrl?: string | null;
  pactsCount: number;
  feedFilter: 'all' | 'mine';
  setFeedFilter: (f: 'all' | 'mine') => void;
}) {
  const firstName = name.split(' ')[0] || 'there';

  return (
    <View style={styles.header}>
      {/* Top Greeting & Profile Bar */}
      <View style={styles.topGreetingBar}>
        <View style={styles.greetingText}>
          <Text variant="caption" color={COLORS.textTertiary} style={styles.greetingEyebrow}>
            DAILY ACCOUNTABILITY
          </Text>
          <Text variant="headingLg" color={COLORS.textPrimary} style={styles.greetingTitle}>
            Hey, {firstName}
          </Text>
        </View>
        <Avatar name={name} size={48} url={avatarUrl ?? null} />
      </View>

      {/* Stats Card */}
      <View style={styles.statsCard}>
        <View style={styles.statBox}>
          <View style={styles.statHeaderRow}>
            <View style={styles.statIconBadge}>
              <Icon name="fire" size={14} color={COLORS.accentRed} />
            </View>
            <Text variant="caption" color={COLORS.textSecondary}>Streak</Text>
          </View>
          <Text variant="numericMd" color={COLORS.textPrimary} style={styles.statVal}>
            14d
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statBox}>
          <View style={styles.statHeaderRow}>
            <View style={[styles.statIconBadge, { backgroundColor: 'rgba(46, 157, 106, 0.15)' }]}>
              <Icon name="check" size={14} color={COLORS.positive} />
            </View>
            <Text variant="caption" color={COLORS.textSecondary}>Today</Text>
          </View>
          <Text variant="numericMd" color={COLORS.textPrimary} style={styles.statVal}>
            2 done
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statBox}>
          <View style={styles.statHeaderRow}>
            <View style={[styles.statIconBadge, { backgroundColor: 'rgba(58, 130, 247, 0.15)' }]}>
              <Icon name="users" size={14} color={COLORS.accentBlue} />
            </View>
            <Text variant="caption" color={COLORS.textSecondary}>Pacts</Text>
          </View>
          <Text variant="numericMd" color={COLORS.textPrimary} style={styles.statVal}>
            {pactsCount}
          </Text>
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
  },
  header: {
    paddingHorizontal: SPACE.lg,
    paddingTop: SPACE.md,
    paddingBottom: SPACE.sm,
  },
  topGreetingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACE.sm,
  },
  greetingText: {
    flex: 1,
  },
  greetingEyebrow: {
    letterSpacing: 1.2,
    fontSize: 10,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  greetingTitle: {
    letterSpacing: -0.5,
  },
  feedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACE.xl,
    marginBottom: SPACE.md,
    paddingHorizontal: SPACE.lg,
  },
  feedTitleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
  },
  filterPills: {
    flexDirection: 'row',
    gap: SPACE.xs,
  },
  filterPill: {
    paddingHorizontal: SPACE.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  filterPillActive: {
    backgroundColor: COLORS.accentBlue,
  },
  filterPillInactive: {
    backgroundColor: COLORS.bgPanel,
    borderWidth: 1,
    borderColor: COLORS.hairline,
  },
  groupFilterScroll: {
    paddingHorizontal: SPACE.lg,
    paddingBottom: SPACE.md,
    gap: SPACE.xs,
  },
  groupFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupFilterChipActive: {
    backgroundColor: COLORS.accentMuted,
    borderWidth: 1,
    borderColor: COLORS.accentBlue,
  },
  groupFilterChipInactive: {
    backgroundColor: COLORS.bgPanel,
    borderWidth: 1,
    borderColor: COLORS.hairline,
  },
  groupFilterText: {
    fontWeight: '600',
  },
  empty: {
    paddingHorizontal: SPACE.lg,
    marginTop: SPACE.xl,
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${COLORS.accentRed}15`,
    borderWidth: 1,
    borderColor: `${COLORS.accentRed}30`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACE.md,
  },
  emptyTitle: {
    marginBottom: SPACE.xs,
  },
  emptySub: {
    textAlign: 'center',
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
    marginBottom: SPACE.lg,
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
});
