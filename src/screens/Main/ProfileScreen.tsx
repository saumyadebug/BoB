import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, Pressable, Alert } from 'react-native';
import { Text, Avatar, Card, Badge, Button, Icon, Skeleton } from '@/components/ui';
import { COLORS, RADIUS } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { useCurrentUser, useUserGroups } from '@/hooks';
import { useUserStreaks } from '@/hooks/useStreaks';
import { useUserSubmissions } from '@/hooks/useSubmissions';
import { useUserBadges, useAllBadges } from '@/hooks/useBadges';
import { supabase } from '@/services/supabase';
import { useNavigation } from '@react-navigation/native';
import { levelFromXp, xpProgressInLevel } from '@/utils/progression';
import { IconName } from '@/components/ui/Icon';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { data: streaks = [] } = useUserStreaks(user?.id ?? '');
  const { data: submissions = [] } = useUserSubmissions(user?.id ?? '');
  const { data: earnedBadges = [] } = useUserBadges(user?.id ?? '');
  const { data: allBadges = [] } = useAllBadges();

  const xp = currentUser?.xp ?? 0;
  const { level, name: levelName, nextLevelXp } = levelFromXp(xp);
  const progress = xpProgressInLevel(xp);

  // Longest streak across all of the user's activities
  const longestStreak = useMemo(
    () => streaks.reduce((max, s) => Math.max(max, s.longestStreak), currentUser?.longestStreak ?? 0),
    [streaks, currentUser]
  );
  const currentBestStreak = useMemo(
    () => streaks.reduce((max, s) => Math.max(max, s.currentStreak), 0),
    [streaks]
  );

  // Build a unified achievements list - earned first, then locked fillers
  const achievements = useMemo(() => {
    const earnedById = new Map(earnedBadges.map(b => [b.badgeId, b]));
    return allBadges.map(b => {
      const e = earnedById.get(b.id);
      return {
        id: b.id,
        icon: (b.icon as IconName) || 'medal',
        label: b.name,
        color: badgeColor(b.id),
        earned: !!e,
      };
    });
  }, [allBadges, earnedBadges]);

  const totalSubmissions = currentUser?.totalSubmissions ?? submissions.length;
  const shields = currentUser?.shieldsAvailable ?? 0;

  if (userLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingWrap}>
          <Skeleton width={64} height={64} borderRadius={32} />
          <View style={{ height: 16 }} />
          <Skeleton width="60%" height={18} borderRadius={4} />
          <View style={{ height: 8 }} />
          <Skeleton width="40%" height={14} borderRadius={4} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text variant="eyebrow" color={COLORS.textSecondary}>Profile</Text>
            <Pressable
              hitSlop={8}
              style={styles.settingsBtn}
              onPress={() => Alert.alert('Settings', 'Settings screen is Phase 9.')}
            >
              <Icon name="gear" size={20} color={COLORS.textPrimary} />
            </Pressable>
          </View>

          <View style={styles.identity}>
            <Avatar
              src={currentUser?.avatarUrl}
              name={currentUser?.displayName || user?.displayName}
              size="xl"
              status="online"
            />
            <View style={styles.identityText}>
              <Text variant="displaySm" color={COLORS.textPrimary}>
                {currentUser?.displayName || user?.displayName || 'You'}
              </Text>
              <Text variant="body" color={COLORS.textSecondary} style={styles.handle}>
                @{currentUser?.username || user?.username || 'you'}
              </Text>
              <View style={styles.badgeRow}>
                <Badge
                  label={`Level ${level} ${levelName}`}
                  icon="lightning"
                  variant="primary"
                />
                <Badge
                  label={`${shields} shield${shields === 1 ? '' : 's'}`}
                  icon="shield-check"
                  variant="neutral"
                />
              </View>
            </View>
          </View>

          <View style={styles.xpBlock}>
            <View style={styles.xpHeader}>
              <Text variant="caption" color={COLORS.textSecondary}>
                {nextLevelXp !== null
                  ? `XP to Level ${level + 1}`
                  : 'Max level reached'}
              </Text>
              <Text variant="numericSm" color={COLORS.textPrimary}>
                {xp.toLocaleString()}
                {nextLevelXp !== null ? ` / ${nextLevelXp.toLocaleString()}` : ''}
              </Text>
            </View>
            <View style={styles.xpTrack}>
              <View style={[styles.xpFill, { width: `${progress.percent}%` }]} />
            </View>
          </View>

          <Button
            label="Edit profile"
            variant="secondary"
            fullWidth
            leadingIcon="pencil-simple"
            onPress={() => Alert.alert(
              'Edit profile',
              'Profile editing arrives in Phase 9. For now, you can update your avatar by tapping the avatar above.'
            )}
          />
        </View>

        {/* Stats grid */}
        <View style={styles.section}>
          <Text variant="eyebrow" color={COLORS.textSecondary} style={styles.sectionEyebrow}>
            Stats
          </Text>
          <View style={styles.statsGrid}>
            <StatCard value={totalSubmissions} label="Submissions" icon="paper-plane-tilt" />
            <StatCard value={longestStreak} label="Longest streak" icon="flame" accent />
            <StatCard value={xp.toLocaleString()} label="Total XP" icon="lightning" />
            <StatCard value={currentBestStreak} label="Current best" icon="flame" />
          </View>
        </View>

        {/* Sign out */}
        <View style={[styles.section, { marginTop: 8 }]}>
          <Button
            label="Sign out"
            variant="ghost"
            fullWidth
            leadingIcon="sign-out"
            onPress={() => {
              Alert.alert('Sign out?', 'You can sign back in anytime.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Sign out',
                  style: 'destructive',
                  onPress: async () => {
                    try { await supabase.auth.signOut(); } catch {}
                    useAuthStore.getState().logout();
                    navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
                  },
                },
              ]);
            }}
          />
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="eyebrow" color={COLORS.textSecondary}>
              Achievements
            </Text>
            <Pressable hitSlop={6}>
              <Text variant="label" color={COLORS.accentBlue}>
                {earnedBadges.length}/{allBadges.length}
              </Text>
            </Pressable>
          </View>
          {achievements.length === 0 ? (
            <Card variant="flat" padding="lg" style={styles.emptyCard}>
              <Text variant="bodySm" color={COLORS.textSecondary} style={{ textAlign: 'center' }}>
                Badges will appear here as you earn them.
              </Text>
            </Card>
          ) : (
            <View style={styles.achGrid}>
              {achievements.slice(0, 8).map(a => (
                <View key={a.id} style={[styles.achCell, !a.earned && styles.achCellLocked]}>
                  <View style={[styles.achIcon, { backgroundColor: hexToTint(a.color, 0.14) }]}>
                    <Icon
                      name={a.icon}
                      size={24}
                      color={a.earned ? a.color : COLORS.textTertiary}
                    />
                  </View>
                  <Text
                    variant="caption"
                    color={a.earned ? COLORS.textPrimary : COLORS.textTertiary}
                    numberOfLines={1}
                  >
                    {a.label}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ value, label, icon, accent }: { value: string | number; label: string; icon: IconName; accent?: boolean }) {
  return (
    <Card variant="flat" padding="lg" style={styles.statCard}>
      <View style={[styles.statIcon, accent ? styles.statIconAccent : null]}>
        <Icon name={icon} size={18} color={accent ? COLORS.accentBlue : COLORS.textSecondary} />
      </View>
      <Text variant="numericLg" color={COLORS.textPrimary} style={styles.statValue}>
        {value}
      </Text>
      <Text variant="caption" color={COLORS.textSecondary}>{label}</Text>
    </Card>
  );
}

function badgeColor(badgeId: string): string {
  // Hash a badge ID into one of our 5 brand-aligned accent colors.
  // Stable across renders (same id -> same color).
  const palette = ['#FF5B1F', '#8B5CF6', '#2E9D6A', '#0EA5E9', '#F59E0B', '#EC4899'];
  let h = 0;
  for (let i = 0; i < badgeId.length; i++) h = (h << 5) - h + badgeId.charCodeAt(i);
  return palette[Math.abs(h) % palette.length];
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
  scroll: { paddingBottom: 120 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingsBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgPanel,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.hairline,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginBottom: 20,
  },
  identityText: { flex: 1 },
  handle: { marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  xpBlock: { marginBottom: 16 },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  xpTrack: {
    height: 8,
    backgroundColor: COLORS.bgSurface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpFill: { height: '100%', backgroundColor: COLORS.accentBlue, borderRadius: 4 },
  section: { paddingHorizontal: 24, paddingVertical: 12 },
  sectionEyebrow: { marginBottom: 14 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '48%', gap: 6 },
  statIcon: {
    width: 32, height: 32, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgSurface,
    alignItems: 'center', justifyContent: 'center',
  },
  statIconAccent: { backgroundColor: COLORS.accentTint },
  statValue: { marginTop: 2 },
  achGrid: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  achCell: {
    alignItems: 'center',
    width: 84,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgPanel,
    borderWidth: 1,
    borderColor: COLORS.hairline,
  },
  achCellLocked: { opacity: 0.6 },
  achIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 24,
  },
});
