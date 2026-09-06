import React from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ComparativeView, DuelMember, YearOverviewHeatmap, Text, Icon } from '@/components/ui';
import { COLORS, SPACE } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { useComparativeDuel, useUserYearHeatmap } from '@/hooks/useStreaks';

export default function ComparativeScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuthStore();

  const rawM1 = route.params?.member1Id;
  const rawM2 = route.params?.member2Id;

  // Resolve member1 (default to current user)
  const member1Id = (!rawM1 || rawM1 === 'u1' || rawM1 === 'current-user')
    ? (user?.id || 'dev-user')
    : rawM1;

  // Resolve member2
  const member2Id = (!rawM2 || rawM2 === 'u2')
    ? 'sarah-user'
    : rawM2;

  const { data: duelData, isLoading: duelLoading } = useComparativeDuel(member1Id, member2Id);
  const { data: heatmapData = [] } = useUserYearHeatmap(member1Id);

  // Fallback duel representation if data is still settling
  const fallbackMember1: DuelMember = {
    id: member1Id,
    name: user?.displayName || 'You',
    color: '#3B82F6',
    calendarData: {},
  };

  const fallbackMember2: DuelMember = {
    id: member2Id,
    name: 'Pact Member',
    color: '#F59E0B',
    calendarData: {},
  };

  const activeM1 = duelData?.member1 || fallbackMember1;
  const activeM2 = duelData?.member2 || fallbackMember2;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}
          hitSlop={6}
        >
          <Icon name="x" size={20} color={COLORS.textPrimary} />
        </Pressable>
        <View style={styles.titleContainer}>
          <Text variant="headingMd" color={COLORS.textPrimary} style={styles.headerTitle}>
            Streak Duel
          </Text>
          {duelData?.leadText && (
            <Text variant="caption" color={COLORS.accentBlue} style={styles.leadText}>
              {duelData.leadText}
            </Text>
          )}
        </View>
        <View style={styles.iconBtnPlaceholder} />
      </View>

      {duelLoading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator color={COLORS.accentBlue} size="large" />
        </View>
      ) : (
        <>
          <ComparativeView member1={activeM1} member2={activeM2} style={{ flex: 1 }} />

          {heatmapData.length > 0 && (
            <View style={styles.heatmapWrapper}>
              <Text variant="eyebrow" color={COLORS.textSecondary} style={{ marginBottom: SPACE.xs }}>
                Consistency Graph (365 Days)
              </Text>
              <YearOverviewHeatmap data={heatmapData} />
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bgBase },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    textAlign: 'center',
  },
  leadText: {
    marginTop: 2,
    fontWeight: '600',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgPanel,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.hairline,
  },
  iconBtnPlaceholder: {
    width: 40,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heatmapWrapper: {
    padding: SPACE.lg,
    paddingBottom: SPACE.xxl,
  },
});
