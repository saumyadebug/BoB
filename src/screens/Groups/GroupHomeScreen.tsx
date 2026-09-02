import React, { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, RefreshControl, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, Avatar, Card, Badge, Icon, IconName, BottomSheet, Input, StreakSummaryBar, CalendarGrid } from '@/components/ui';
import { COLORS, RADIUS, SHADOWS, SPACE } from '@/constants/theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ActivityCard, MemberActivityStatus } from '@/components/groups/ActivityCard';
import { Activity, GroupMember } from '@/types';
import * as Haptics from 'expo-haptics';
import { VoltPeek } from '@/components/brand/VoltMark';

type Tab = 'feed' | 'calendar' | 'activities' | 'members' | 'leaderboard';

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'feed', label: 'Feed', icon: 'house' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar' },
  { id: 'activities', label: 'Activities', icon: 'target' },
  { id: 'members', label: 'Members', icon: 'users' },
  { id: 'leaderboard', label: 'Ranks', icon: 'trophy' },
];

const MOCK_GROUP = {
  id: 'g1',
  name: 'Morning Hustle',
  description: 'Crush it before the sun goes down.',
  emoji: '⚡',
  members: [
    { userId: 'u1', role: 'admin', joinedAt: '', user: { id: 'u1', email: '', username: 'AlexR', displayName: 'Alex Rivera', avatarUrl: 'https://i.pravatar.cc/200?u=alex', xp: 4250, level: 4, totalSubmissions: 48, longestStreak: 18, shieldsAvailable: 2, createdAt: '', updatedAt: '' }},
    { userId: 'u2', role: 'member', joinedAt: '', user: { id: 'u2', email: '', username: 'SarahK', displayName: 'Sarah Kim', avatarUrl: 'https://i.pravatar.cc/200?u=sarah', xp: 3800, level: 4, totalSubmissions: 32, longestStreak: 12, shieldsAvailable: 1, createdAt: '', updatedAt: '' }},
    { userId: 'u3', role: 'member', joinedAt: '', user: { id: 'u3', email: '', username: 'MikeC', displayName: 'Mike Chen', avatarUrl: 'https://i.pravatar.cc/200?u=mike', xp: 1200, level: 2, totalSubmissions: 14, longestStreak: 5, shieldsAvailable: 0, createdAt: '', updatedAt: '' }},
    { userId: 'u4', role: 'member', joinedAt: '', user: { id: 'u4', email: '', username: 'JessL', displayName: 'Jessica Lee', avatarUrl: 'https://i.pravatar.cc/200?u=jessica', xp: 850, level: 2, totalSubmissions: 9, longestStreak: 3, shieldsAvailable: 0, createdAt: '', updatedAt: '' }},
  ] as GroupMember[],
  activities: [
    { id: 'a1', name: 'Gym / Workout', icon: 'barbell' as IconName, color: '#8B5CF6', frequency: 'daily', requirePhoto: true, ownerId: 'g1', groupId: 'g1', createdAt: '', updatedAt: '', fields: [], templateFields: [] } as unknown as Activity,
    { id: 'a2', name: 'Read', icon: 'book' as IconName, color: '#2E9D6A', frequency: 'daily', requirePhoto: false, ownerId: 'g1', groupId: 'g1', createdAt: '', updatedAt: '', fields: [], templateFields: [] } as unknown as Activity,
    { id: 'a3', name: 'Code', icon: 'code' as IconName, color: '#FF5B1F', frequency: 'daily', requirePhoto: false, ownerId: 'g1', groupId: 'g1', createdAt: '', updatedAt: '', fields: [], templateFields: [] } as unknown as Activity,
  ],
  inviteCode: 'HUSTLE7',
  groupStreak: 47,
};

export default function GroupHomeScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [tab, setTab] = useState<Tab>('feed');
  const [refreshing, setRefreshing] = useState(false);
  const [inviteSheet, setInviteSheet] = useState(false);
  const group = MOCK_GROUP;

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleShare = async () => {
    try {
      Haptics.selectionAsync();
      await Share.share({
        message: `Join my StreakPact "${group.name}"! Code: ${group.inviteCode}\nstreakpact://invite/${group.inviteCode}`,
      });
    } catch {}
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
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
            <Icon name="arrow-left" size={20} color={COLORS.inkDisplay} />
          </Pressable>
          <View style={{ flex: 1 }} />
          <Pressable
            onPress={() => navigation.navigate('GroupSettings', { groupId: group.id })}
            style={styles.iconBtn}
            hitSlop={6}
            accessibilityLabel="Settings"
          >
            <Icon name="gear" size={20} color={COLORS.inkDisplay} />
          </Pressable>
        </View>

        {/* Group identity */}
        <View style={styles.identity}>
          <View style={styles.identityRow}>
            <View style={styles.markBox}>
              <Text variant="displayMd">{group.emoji}</Text>
            </View>
            <View style={styles.identityText}>
              <Text variant="eyebrow" color={COLORS.inkSecondary}>Pact</Text>
              <Text variant="displaySm" color={COLORS.inkDisplay}>{group.name}</Text>
            </View>
          </View>
          {group.description ? (
            <Text variant="body" color={COLORS.inkSecondary} style={styles.description}>
              {group.description}
            </Text>
          ) : null}
        </View>

        {/* Stat strip */}
        <View style={styles.statStrip}>
          <StatTile
            label="Group streak"
            value={group.groupStreak.toString()}
            unit="d"
            icon="flame"
            accent
          />
          <View style={styles.statDivider} />
          <StatTile
            label="Members"
            value={group.members.length.toString()}
            unit=""
            icon="users"
          />
          <View style={styles.statDivider} />
          <StatTile
            label="Activities"
            value={group.activities.length.toString()}
            unit=""
            icon="target"
          />
        </View>

        {/* Streak Summary */}
        <StreakSummaryBar 
          members={group.members.map(m => ({
            id: m.userId,
            name: m.user?.displayName || 'User',
            avatarUrl: m.user?.avatarUrl,
            streak: m.user?.longestStreak || 0,
            flameColor: COLORS.accent,
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
                  <Icon name={t.icon} size={16} color={active ? COLORS.inkDisplay : COLORS.inkTertiary} bold={active} />
                  <Text variant="label" color={active ? COLORS.inkDisplay : COLORS.inkTertiary}>
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>


        {/* Tab content */}
        {tab === 'feed' && <FeedTab group={group} onInvite={() => setInviteSheet(true)} />}
        {tab === 'calendar' && <CalendarTab group={group} />}
        {tab === 'activities' && <ActivitiesTab group={group} navigation={navigation} />}
        {tab === 'members' && <MembersTab group={group} navigation={navigation} />}
        {tab === 'leaderboard' && <LeaderboardTab group={group} />}
      </ScrollView>

      <BottomSheet isVisible={inviteSheet} onClose={() => setInviteSheet(false)}>
        <View style={styles.inviteSheet}>
          <Text variant="eyebrow" color={COLORS.inkSecondary} style={styles.inviteEyebrow}>
            Invite code
          </Text>
          <Text variant="numericLg" color={COLORS.inkDisplay} style={styles.inviteCode}>
            {group.inviteCode}
          </Text>
          <Text variant="body" color={COLORS.inkSecondary} style={styles.inviteSub}>
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
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
  return (
    <View style={styles.statTile}>
      <Icon name={icon} size={18} color={accent ? COLORS.accent : COLORS.inkSecondary} />
      <View style={styles.statValueRow}>
        <Text variant="numericLg" color={COLORS.inkDisplay}>{value}</Text>
        {unit ? <Text variant="body" color={COLORS.inkSecondary}>{unit}</Text> : null}
      </View>
      <Text variant="caption" color={COLORS.inkTertiary}>{label}</Text>
    </View>
  );
}

function CalendarTab({ group }: { group: typeof MOCK_GROUP }) {
  const d = new Date();
  const dateStr1 = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const d2 = new Date(); d2.setDate(d.getDate() - 1);
  const dateStr2 = `${d2.getFullYear()}-${String(d2.getMonth() + 1).padStart(2, '0')}-${String(d2.getDate()).padStart(2, '0')}`;
  const d3 = new Date(); d3.setDate(d.getDate() - 2);
  const dateStr3 = `${d3.getFullYear()}-${String(d3.getMonth() + 1).padStart(2, '0')}-${String(d3.getDate()).padStart(2, '0')}`;
  
  const mockCalendarData = {
    [dateStr1]: [COLORS.accent, COLORS.positive, COLORS.warning],
    [dateStr2]: [COLORS.accent, COLORS.positive],
    [dateStr3]: [COLORS.accent, COLORS.positive, COLORS.warning, COLORS.brandPrimaryDark],
  };

  return (
    <View style={styles.tabContent}>
      <CalendarGrid data={mockCalendarData} />
    </View>
  );
}

function FeedTab({ group, onInvite }: { group: typeof MOCK_GROUP; onInvite: () => void }) {
  return (
    <View style={styles.tabContent}>
      <Card variant="outline" padding="lg" style={styles.inviteCard}>
        <View style={styles.inviteRow}>
          <View style={styles.inviteIconBox}>
            <Icon name="user-plus" size={20} color={COLORS.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="label" color={COLORS.inkDisplay}>Invite friends</Text>
            <Text variant="caption" color={COLORS.inkSecondary}>
              5 of 6 spots filled
            </Text>
          </View>
          <Button label="Invite" variant="secondary" size="sm" onPress={onInvite} />
        </View>
      </Card>

      <Text variant="eyebrow" color={COLORS.inkSecondary} style={styles.subhead}>
        Recent activity
      </Text>

      <Card variant="flat" padding="lg" style={styles.emptyCard}>
        <VoltPeek size={80} style={{ marginBottom: 16 }} />
        <Text variant="headingSm" color={COLORS.inkDisplay}>No submissions yet</Text>
        <Text variant="bodySm" color={COLORS.inkSecondary} style={styles.emptyText}>
          Once members submit, their streaks will show up here.
        </Text>
      </Card>
    </View>
  );
}

function ActivitiesTab({ group, navigation }: { group: typeof MOCK_GROUP; navigation: any }) {
  return (
    <View style={styles.tabContent}>
      {group.activities.map((activity, i) => {
        const memberStatuses: MemberActivityStatus[] = group.members.map((m, idx) => ({
          member: m,
          currentStreak: [12, 8, 4, 2][idx % 4],
          hasSubmittedToday: idx % 2 === 0,
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

function MembersTab({ group, navigation }: { group: typeof MOCK_GROUP; navigation: any }) {
  const sorted = [...group.members].sort((a, b) => (b.user?.xp || 0) - (a.user?.xp || 0));
  return (
    <View style={styles.tabContent}>
      {sorted.map((m, i) => (
        <Pressable
          key={m.userId}
          onPress={() => navigation.navigate('Comparative', { member1Id: 'u1', member2Id: m.userId })}
        >
          <Card variant="flat" padding="lg" style={styles.memberRow}>
            <Text variant="numericMd" color={COLORS.inkTertiary} style={styles.memberRank}>
              {String(i + 1).padStart(2, '0')}
            </Text>
            <Avatar src={m.user?.avatarUrl} name={m.user?.displayName} size="md" />
            <View style={{ flex: 1 }}>
              <View style={styles.memberNameRow}>
                <Text variant="headingSm" color={COLORS.inkDisplay} numberOfLines={1}>
                  {m.user?.displayName}
                </Text>
                {m.role === 'admin' && <Badge label="Admin" variant="neutral" />}
              </View>
              <Text variant="caption" color={COLORS.inkSecondary}>
                @{m.user?.username} · Level {m.user?.level}
              </Text>
            </View>
            <View style={styles.memberStats}>
              <Text variant="numericMd" color={COLORS.inkDisplay}>
                {m.user?.xp?.toLocaleString()}
              </Text>
              <Text variant="caption" color={COLORS.inkTertiary}>XP</Text>
            </View>
          </Card>
        </Pressable>
      ))}
    </View>
  );
}

function LeaderboardTab({ group }: { group: typeof MOCK_GROUP }) {
  const sorted = [...group.members].sort((a, b) => (b.user?.xp || 0) - (a.user?.xp || 0));
  return sorted.map((m, i) => {
    const isTop3 = i < 3;
    return (
      <Card key={m.userId} variant="flat" padding="lg" style={[styles.lbRow, isTop3 ? styles.lbRowTop : null]}>
        <View style={styles.lbRank}>
          {isTop3 ? (
            <Icon name="crown" size={18} color={i === 0 ? '#FBBF24' : i === 1 ? '#9CA3AF' : '#B45309'} bold />
          ) : (
            <Text variant="numericMd" color={COLORS.inkTertiary}>{i + 1}</Text>
          )}
        </View>
        <Avatar src={m.user?.avatarUrl} name={m.user?.displayName} size="sm" />
        <Text variant="label" color={COLORS.inkDisplay} style={styles.lbName} numberOfLines={1}>
          {m.user?.displayName}
        </Text>
        <Text variant="numericSm" color={COLORS.accent}>
          {m.user?.xp?.toLocaleString()} XP
        </Text>
      </Card>
    );
  });
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.surfaceBase },
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
    backgroundColor: COLORS.surfaceElevated,
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
    backgroundColor: COLORS.surfaceElevated,
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
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    gap: 6,
  },
  tabActive: {
    backgroundColor: COLORS.inkDisplay,
    borderColor: COLORS.inkDisplay,
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
    backgroundColor: COLORS.surfaceElevated,
  },
  lbRank: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.surfaceSunken,
    alignItems: 'center', justifyContent: 'center',
  },
  lbName: { flex: 1 },
  inviteSheet: { paddingVertical: 8 },
  inviteEyebrow: { textAlign: 'center', marginBottom: 12 },
  inviteCode: { textAlign: 'center', marginBottom: 12, letterSpacing: 6 },
  inviteSub: { textAlign: 'center', lineHeight: 22 },
});
