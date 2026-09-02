import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert, Animated, Pressable } from 'react-native';
import AnimatedLib, {
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Text, Button, BottomSheet, Icon, IconName, GroupCardSkeleton } from '@/components/ui';
import { GroupCard } from '@/components/groups/GroupCard';
import { useUserGroups, useLeaveGroup } from '@/hooks/useGroups';
import { useAllGroupActivities, useGroupSubmissionCounts, useAllGroupStreaks } from '@/hooks/useActivities';
import { COLORS } from '@/constants/theme';
import { useNavigation } from '@react-navigation/native';
import { VoltPeek } from '@/components/brand/VoltMark';
import { isAppError } from '@/services/errors';
import { resolveGroupIcon, vibeVisuals } from '@/utils/groupVisuals';

export default function GroupsScreen() {
  const navigation = useNavigation<any>();
  const { data: groups = [], isLoading, refetch, isError, error } = useUserGroups();
  const leaveGroup = useLeaveGroup();
  const [refreshing, setRefreshing] = useState(false);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);

  const groupIds = useMemo(() => groups.map(g => g.id), [groups]);

  // Real per-group stats for the cards. One query per stat type, not per group.
  const { data: activitiesByGroup = {} } = useAllGroupActivities(groupIds);
  const { data: submissionStats } = useGroupSubmissionCounts(groupIds);
  const { data: streaksByGroup = {} } = useAllGroupStreaks(groupIds);

  const onRefresh = async () => {
    setRefreshing(true);
    try { await refetch(); } finally { setRefreshing(false); }
  };

  const handleGroupPress = (groupId: string) => {
    navigation.navigate('GroupHome', { groupId });
  };

  const handleGroupLongPress = (groupId: string, groupName: string) => {
    Alert.alert(
      'Leave pact?',
      `You'll lose your streak in ${groupName}. You can be re-invited.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => leaveGroup.mutate(groupId, {
            onError: (e) => {
              if (isAppError(e) && e.code === 'NOT_ALLOWED') {
                Alert.alert('Cannot leave', 'Promote another admin before leaving.');
              } else {
                Alert.alert('Error', (e as Error).message);
              }
            },
          }),
        },
      ],
    );
  };

  // Volt pulse animation
  const voltScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (groups.length === 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(voltScale, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
          Animated.timing(voltScale, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [groups.length]);

  const renderEmptyComponent = () => (
    <View style={styles.empty}>
      <Animated.View style={[styles.voltPlaceholder, { transform: [{ scale: voltScale }] }]}>
        <VoltPeek size={100} />
      </Animated.View>
      <Text variant="headingLg" color={COLORS.textPrimary} style={styles.emptyTitle}>
        No pacts yet
      </Text>
      <Text variant="body" color={COLORS.textSecondary} style={styles.emptySub}>
        Create a pact or join one with an invite code. Show up together.
      </Text>
      {isError && (
        <Text variant="caption" color={COLORS.danger} style={styles.errorHint}>
          {(error as Error)?.message ?? 'Could not load your pacts.'}
        </Text>
      )}
    </View>
  );

  // Tactile FAB
  const fabTranslateY = useRef(new Animated.Value(0)).current;
  const handleFabPressIn = () => {
    Animated.spring(fabTranslateY, { toValue: 4, useNativeDriver: true, speed: 50 }).start();
  };
  const handleFabPressOut = () => {
    Animated.spring(fabTranslateY, { toValue: 0, useNativeDriver: true, speed: 50 }).start();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="eyebrow" color={COLORS.textSecondary}>Your pacts</Text>
        <Text variant="displaySm" color={COLORS.textPrimary} style={styles.headerTitle}>
          {groups.length} {groups.length === 1 ? 'pact' : 'pacts'}
        </Text>
      </View>

      <FlatList
        data={groups}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accentBlue}
          />
        }
        ListEmptyComponent={isLoading ? null : renderEmptyComponent}
        renderItem={({ item }) => {
          // The `emoji` column stores a Phosphor icon name (or a legacy unicode
          // emoji if a row was created before Phase 4.3). Resolve it to a valid
          // IconName and pick a tint that matches the group vibe.
          const visuals = vibeVisuals(item.vibe);
          const activities = activitiesByGroup[item.id] ?? [];
          const submittedToday = submissionStats?.submittedTodayByGroup[item.id] ?? new Set();
          const memberCount = item.memberCount ?? 0;
          const allSubmitted = memberCount > 0 && submittedToday.size >= memberCount;
          return (
            <GroupCard
              id={item.id}
              name={item.name}
              icon={resolveGroupIcon(item.emoji)}
              iconColor={visuals.color}
              members={(item as any).members || []}
              activitiesCount={activities.length}
              allSubmitted={allSubmitted}
              streakDays={streaksByGroup[item.id] ?? 0}
              onPress={() => handleGroupPress(item.id)}
              onLongPress={() => handleGroupLongPress(item.id, item.name)}
            />
          );
        }}
        // Skeletons during initial load
        ListFooterComponent={isLoading ? (
          <View>
            <GroupCardSkeleton />
            <GroupCardSkeleton />
          </View>
        ) : null}
      />

      <View style={styles.fabWrap}>
        <Pressable
          onPress={() => setActionSheetVisible(true)}
          style={({ pressed }) => [styles.fab, pressed ? styles.fabPressed : null]}
          accessibilityRole="button"
          accessibilityLabel="Add pact"
        >
          <Icon name="plus" size={26} color="#FFFFFF" />
        </Pressable>
      </View>

      <BottomSheet isVisible={actionSheetVisible} onClose={() => setActionSheetVisible(false)}>
        <Text variant="headingMd" color={COLORS.textPrimary} style={styles.sheetTitle}>
          Add a pact
        </Text>
        <Text variant="body" color={COLORS.textSecondary} style={styles.sheetSub}>
          Start a new one, or join with a code from a friend.
        </Text>

        <View style={{ height: 24 }} />
        <Button
          label="Start a new pact"
          fullWidth
          size="lg"
          trailingIcon="arrow-right"
          onPress={() => {
            setActionSheetVisible(false);
            navigation.navigate('CreateGroup');
          }}
        />
        <View style={{ height: 10 }} />
        <Button
          label="Join with code"
          fullWidth
          size="lg"
          variant="secondary"
          leadingIcon="key"
          onPress={() => {
            setActionSheetVisible(false);
            navigation.navigate('JoinGroup');
          }}
        />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgBase },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerTitle: { marginTop: 4 },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 140,
  },
  fabWrap: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.accentBlue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  fabPressed: {
    transform: [{ scale: 0.96 }],
    shadowOpacity: 0.15,
  },
  sheetTitle: { textAlign: 'center' },
  sheetSub: { textAlign: 'center', marginTop: 6, lineHeight: 22 },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: { marginTop: 24, marginBottom: 8, textAlign: 'center' },
  emptySub: { textAlign: 'center', lineHeight: 22, maxWidth: 280 },
  errorHint: { marginTop: 16, textAlign: 'center', maxWidth: 280 },
  voltPlaceholder: { alignItems: 'center', justifyContent: 'center' },
});
