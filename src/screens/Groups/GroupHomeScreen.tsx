import React, { useState, useRef, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable, RefreshControl, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, Avatar, Card, Badge, Icon, IconName, BottomSheet, Input, StreakSummaryBar, CalendarGrid, VoltPeek, FeedCard } from '@/components/ui';
import { COLORS, RADIUS, SHADOWS, SPACE } from '@/constants/theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ActivityCard, MemberActivityStatus } from '@/components/groups/ActivityCard';
import { GroupMember } from '@/types';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useGroup, useGroupActivities, useGroupStreak } from '@/hooks';
import { useGroupSubmissions } from '@/hooks/useSubmissions';
import { resolveGroupIcon } from '@/utils/groupVisuals';
import { submissionToFeedCard } from '@/utils/feedAdapters';

type Tab = 'feed' | 'calendar' | 'activities' | 'members' | 'leaderboard';

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'feed', label: 'Feed', icon: 'house' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar' },
  { id: 'activities', label: 'Activities', icon: 'target' },
  { id: 'members', label: 'Members', icon: 'users' },
  { id: 'leaderboard', label: 'Ranks', icon: 'trophy' },
];

export default function GroupHomeScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const groupId: string = route.params?.groupId;
  const [tab, setTab] = useState<Tab>('feed');
  const [refreshing, setRefreshing] = useState(false);
  const [inviteSheet, setInviteSheet] = useState(false);

  const { data: groupData, isLoading, refetch } = useGroup(groupId);
  const { data: activities = [] } = useGroupActivities(groupId);
  const { data: submissions = [] } = useGroupSubmissions(groupId, 20);
  const { data: groupStreak = 0 } = useGroupStreak(groupId);

  const group = groupData?.group;
  const members = groupData?.members ?? [];

  /**
   * Compute each member's status for each activity: has this member
   * submitted for this activity today? Used to drive the `submitted`/
   * `pending` dots on the activity cards.
   */
  const submissionStatusByMemberActivity = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const map = new Map<string, Set<string>>(); // memberId -> set of activityIds submitted today
    for (const s of submissions) {
      if (!s.clientTimestamp || s.clientTimestamp.slice(0, 10) !== today) continue;
      if (!map.has(s.userId)) map.set(s.userId, new Set());
      map.get(s.userId)!.add(s.activityId);
    }
    return map;
  }, [submissions]);

  const onRefresh = async () => {
    setRefreshing(true);
    try { await refetch(); } finally { setRefreshing(false); }
  };

  const handleShare = async () => {
    if (!group) return;
    try {
      Haptics.selectionAsync();
      await Share.share({
        message: `Join my StreakPact "${group.name}"! Code: ${group.inviteCode}\nstreakpact://invite/${group.inviteCode}`,
      });
    } catch {}
  };

  // Loading + not-found states
  if (isLoading || !group) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingWrap}>
          <Text variant="body" color={COLORS.textSecondary}>
            {isLoading ? 'Loading pact...' : 'Pact not found.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accentBlue} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.iconBtn}
            hitSlop={6}
            accessibilityLabel="Back"
          >
            <Icon name="arrow-left" size={20} color={COLORS.textPrimary} />
          </Pressable>
          <View style={{ flex: 1 }} />
          <Pressable
            onPress={() => navigation.navigate('GroupSettings', { groupId: group.id })}
            style={styles.iconBtn}
            hitSlop={6}
            accessibilityLabel="Settings"
          >
            <Icon name="gear" size={20} color={COLORS.textPrimary} />
          </Pressable>
        </View>

        {/* Group identity */}
        <View style={styles.identity}>
          <View style={styles.identityRow}>
            <View style={styles.markBox}>
              <Icon name={resolveGroupIcon(group.emoji)} size={32} color={COLORS.accentBlue} />
            </View>
            <View style={styles.identityText}>
              <Text variant="eyebrow" color={COLORS.textSecondary}>Pact</Text>
              <Text variant="displaySm" color={COLORS.textPrimary}>{group.name}</Text>
            </View>
          </View>
          {group.goalDescription ? (
            <Text variant="body" color={COLORS.textSecondary} style={styles.description}>
              {group.goalDescription}
            </Text>
          ) : null}
        </View>

        {/* Stat strip */}
        <View style={styles.statStrip}>
          <StatTile
            label="Group streak"
            value={String(groupStreak)}
            unit="d"
            icon="flame"
            accent
          />
          <View style={styles.statDivider} />
          <StatTile
            label="Members"
            value={String(group.memberCount)}
            unit=""
            icon="users"
          />
          <View style={styles.statDivider} />
          <StatTile
            label="Activities"
            value={String(activities.length)}
            unit=""
            icon="target"
          />
        </View>

        {/* Streak Summary */}
        <StreakSummaryBar 
          members={members.map((m: any) => ({
            id: m.userId,
            name: m.user?.displayName || 'User',
            avatarUrl: m.user?.avatarUrl,
            streak: m.user?.longestStreak || 0,
            flameColor: COLORS.accentBlue,
          }))} 
        />

        {/* Tabs */}
        <View style={styles.tabsRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {TABS.map(t => {
              const active = tab === t.id;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => setTab(t.id)}
                  style={[styles.tab, active ? styles.tabActive : null]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                >
                  <Icon name={t.icon} size={16} color={active ? COLORS.textPrimary : COLORS.textTertiary} bold={active} />
                  <Text variant="label" color={active ? COLORS.textPrimary : COLORS.textTertiary}>
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>


        {/* Tab content */}
        {tab === 'feed' && (
          <FeedTab
            group={group}
            members={members}
            submissions={submissions}
            onInvite={() => setInviteSheet(true)}
          />
        )}
        {tab === 'calendar' && <CalendarTab group={group} />}
        {tab === 'activities' && (
          <ActivitiesTab
            group={group}
            activities={activities}
            members={members}
            submissionStatusByMemberActivity={submissionStatusByMemberActivity}
            navigation={navigation}
          />
        )}
        {tab === 'members' && <MembersTab group={group} members={members} navigation={navigation} />}
        {tab === 'leaderboard' && <LeaderboardTab group={group} members={members} />}
      </ScrollView>

      <BottomSheet isVisible={inviteSheet} onClose={() => setInviteSheet(false)}>
        <View style={styles.inviteSheet}>
          <Text variant="eyebrow" color={COLORS.textSecondary} style={styles.inviteEyebrow}>
            Invite code
          </Text>
          <Text variant="numericLg" color={COLORS.textPrimary} style={styles.inviteCode}>
            {group.inviteCode}
          </Text>
          <Text variant="body" color={COLORS.textSecondary} style={styles.inviteSub}>
            Share this code or the link below. New members cap at 6.
          </Text>
          <View style={{ height: 24 }} />
          <Button
            label="Share invite"
            leadingIcon="share-network"
            onPress={handleShare}
            fullWidth
            size="lg"
          />
          <View style={{ height: 10 }} />
          <Button
            label="Copy code"
            variant="secondary"
            leadingIcon="copy"
            onPress={async () => {
              await Clipboard.setStringAsync(group.inviteCode);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Copied', 'Invite code copied to clipboard');
            }}
            fullWidth
            size="lg"
          />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

function StatTile({ label, value, unit, icon, accent }: { label: string; value: string; unit: string; icon: IconName; accent?: boolean }) {
  // Defensive: string-coerce everything so we never render undefined / null as
  // a bare text node, which React web will reject as a child of <View>.
  const safeValue = value == null ? '' : String(value);
  const safeUnit = unit == null ? '' : String(unit);
  const safeLabel = label == null ? '' : String(label);
  return (
    <View style={styles.statTile}>
      <Icon name={icon} size={18} color={accent ? COLORS.accentBlue : COLORS.textSecondary} />
      <View style={styles.statValueRow}>
        <Text variant="numericLg" color={COLORS.textPrimary}>{safeValue}</Text>
        {safeUnit.length > 0 ? (
          <Text variant="body" color={COLORS.textSecondary}>{safeUnit}</Text>
        ) : null}
      </View>
      <Text variant="caption" color={COLORS.textTertiary}>{safeLabel}</Text>
    </View>
  );
}

function CalendarTab({ group }: { group: any }) {
  const d = new Date();
  const dateStr1 = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const d2 = new Date(); d2.setDate(d.getDate() - 1);
  const dateStr2 = `${d2.getFullYear()}-${String(d2.getMonth() + 1).padStart(2, '0')}-${String(d2.getDate()).padStart(2, '0')}`;
  const d3 = new Date(); d3.setDate(d.getDate() - 2);
  const dateStr3 = `${d3.getFullYear()}-${String(d3.getMonth() + 1).padStart(2, '0')}-${String(d3.getDate()).padStart(2, '0')}`;
  
  const mockCalendarData = {
    [dateStr1]: [COLORS.accentBlue, COLORS.positive, COLORS.warning],
    [dateStr2]: [COLORS.accentBlue, COLORS.positive],
    [dateStr3]: [COLORS.accentBlue, COLORS.positive, COLORS.warning, COLORS.bgSurface],
  };

  return (
    <View style={styles.tabContent}>
      <CalendarGrid data={mockCalendarData} />
    </View>
  );
}

function FeedTab({
  group,
  members,
  submissions,
  onInvite,
}: {
  group: any;
  members: any[];
  submissions: any[];
  onInvite: () => void;
}) {
  const groupNameById = useMemo(() => ({ [group.id]: group.name }), [group.id, group.name]);
  return (
    <View style={styles.tabContent}>
      <Card variant="outline" padding="lg" style={styles.inviteCard}>
        <View style={styles.inviteRow}>
          <View style={styles.inviteIconBox}>
            <Icon name="user-plus" size={20} color={COLORS.accentBlue} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="label" color={COLORS.textPrimary}>Invite friends</Text>
            <Text variant="caption" color={COLORS.textSecondary}>
              {Math.max(0, 6 - members.length)} of 6 spots open
            </Text>
          </View>
          <Button label="Invite" variant="secondary" size="sm" onPress={onInvite} />
        </View>
      </Card>

      <Text variant="eyebrow" color={COLORS.textSecondary} style={styles.subhead}>
        Recent activity
      </Text>

      {submissions.length === 0 ? (
        <Card variant="flat" padding="lg" style={styles.emptyCard}>
          <VoltPeek size={80} style={{ marginBottom: 16 }} />
          <Text variant="headingSm" color={COLORS.textPrimary}>No submissions yet</Text>
          <Text variant="bodySm" color={COLORS.textSecondary} style={styles.emptyText}>
            Once members submit, their streaks will show up here.
          </Text>
        </Card>
      ) : (
        submissions.slice(0, 10).map((s: any) => {
          const view = submissionToFeedCard(s, groupNameById);
          return (
            <View key={s.id} style={styles.feedItem}>
              <FeedCard
                user={view.user}
                activity={view.activity}
                submission={view.submission}
              />
            </View>
          );
        })
      )}
    </View>
  );
}

function ActivitiesTab({
  group,
  activities,
  members,
  submissionStatusByMemberActivity,
  navigation,
}: {
  group: any;
  activities: any[];
  members: any[];
  submissionStatusByMemberActivity: Map<string, Set<string>>;
  navigation: any;
}) {
  return (
    <View style={styles.tabContent}>
      {activities.map((activity) => {
        const memberStatuses: MemberActivityStatus[] = members.map((m: any) => ({
          member: m,
          // We don't have streak counts here without a useUserStreaks call.
          // Phase 6 wires the per-user streak; for now show 0 — the dot
          // color is what matters most on the activity card.
          currentStreak: 0,
          hasSubmittedToday: submissionStatusByMemberActivity
            .get(m.userId)
            ?.has(activity.id) ?? false,
        }));
        return (
          <ActivityCard
            key={activity.id}
            activity={activity}
            memberStatuses={memberStatuses}
            onPress={() => navigation.navigate('ActivityDetail', { groupId: group.id, activityId: activity.id })}
            onSubmit={() => Alert.alert('Submit', `Open submission flow for ${activity.name}`)}
          />
        );
      })}

      <Button
        label="Add activity"
        variant="secondary"
        fullWidth
        leadingIcon="plus"
        onPress={() => navigation.navigate('CreateActivity', { groupId: group.id })}
        style={styles.addActivity}
      />
    </View>
  );
}

function MembersTab({ members, navigation }: { group: any; members: any[]; navigation: any }) {
  const sorted = [...members].sort((a, b) => (b.user?.xp || 0) - (a.user?.xp || 0));
  return (
    <View style={styles.tabContent}>
      {sorted.map((m: any, i: number) => (
        <Pressable
          key={m.userId}
          onPress={() => navigation.navigate('Comparative', { member1Id: 'u1', member2Id: m.userId })}
        >
          <Card variant="flat" padding="lg" style={styles.memberRow}>
            <Text variant="numericMd" color={COLORS.textTertiary} style={styles.memberRank}>
              {String(i + 1).padStart(2, '0')}
            </Text>
            <Avatar src={m.user?.avatarUrl} name={m.user?.displayName} size="md" />
            <View style={{ flex: 1 }}>
              <View style={styles.memberNameRow}>
                <Text variant="headingSm" color={COLORS.textPrimary} numberOfLines={1}>
                  {m.user?.displayName}
                </Text>
                {m.role === 'admin' && <Badge label="Admin" variant="neutral" />}
              </View>
              <Text variant="caption" color={COLORS.textSecondary}>
                @{m.user?.username} · Level {m.user?.level}
              </Text>
            </View>
            <View style={styles.memberStats}>
              <Text variant="numericMd" color={COLORS.textPrimary}>
                {m.user?.xp?.toLocaleString()}
              </Text>
              <Text variant="caption" color={COLORS.textTertiary}>XP</Text>
            </View>
          </Card>
        </Pressable>
      ))}
    </View>
  );
}

function LeaderboardTab({ members }: { group: any; members: any[] }) {
  const sorted = [...members].sort((a, b) => (b.user?.xp || 0) - (a.user?.xp || 0));
  return sorted.map((m: any, i: number) => {
    const isTop3 = i < 3;
    return (
      <Card key={m.userId} variant="flat" padding="lg" style={[styles.lbRow, isTop3 ? styles.lbRowTop : null]}>
        <View style={styles.lbRank}>
          {isTop3 ? (
            <Icon name="crown" size={18} color={i === 0 ? '#FBBF24' : i === 1 ? '#9CA3AF' : '#B45309'} bold />
          ) : (
            <Text variant="numericMd" color={COLORS.textTertiary}>{i + 1}</Text>
          )}
        </View>
        <Avatar src={m.user?.avatarUrl} name={m.user?.displayName} size="sm" />
        <Text variant="label" color={COLORS.textPrimary} style={styles.lbName} numberOfLines={1}>
          {m.user?.displayName}
        </Text>
        <Text variant="numericSm" color={COLORS.accentBlue}>
          {m.user?.xp?.toLocaleString()} XP
        </Text>
      </Card>
    );
  });
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bgBase },
  scroll: { paddingBottom: 120 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  iconBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgPanel,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.hairline,
  },
  identity: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  markBox: {
    width: 56, height: 56,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.accentTint,
    alignItems: 'center', justifyContent: 'center',
  },
  identityText: { flex: 1 },
  description: { marginTop: 10, lineHeight: 22 },
  statStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    backgroundColor: COLORS.bgPanel,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    paddingVertical: 16,
    marginBottom: 16,
  },
  statTile: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  feedItem: { marginBottom: 12 },
  statValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.hairline,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgPanel,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    gap: 6,
  },
  tabActive: {
    backgroundColor: COLORS.textPrimary,
    borderColor: COLORS.textPrimary,
  },
  tabContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  subhead: { marginTop: 8, marginBottom: 4 },
  inviteCard: { marginBottom: 8 },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inviteIconBox: {
    width: 40, height: 40, borderRadius: RADIUS.md,
    backgroundColor: COLORS.accentTint,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: { marginTop: 6, textAlign: 'center', maxWidth: 240 },
  addActivity: { marginTop: 8 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberRank: { width: 28 },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  memberStats: { alignItems: 'flex-end' },
  lbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  lbRowTop: {
    backgroundColor: COLORS.bgPanel,
  },
  lbRank: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.bgSurface,
    alignItems: 'center', justifyContent: 'center',
  },
  lbName: { flex: 1 },
  inviteSheet: { paddingVertical: 8 },
  inviteEyebrow: { textAlign: 'center', marginBottom: 12 },
  inviteCode: { textAlign: 'center', marginBottom: 12, letterSpacing: 6 },
  inviteSub: { textAlign: 'center', lineHeight: 22 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
