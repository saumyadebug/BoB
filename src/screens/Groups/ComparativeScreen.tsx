import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ComparativeView, DuelMember, YearOverviewHeatmap, Text, Icon } from '@/components/ui';
import { COLORS, SPACE } from '@/constants/theme';

export default function ComparativeScreen() {
  const navigation = useNavigation<any>();

  // Mock data for the duel
  const member1: DuelMember = {
    id: 'u1',
    name: 'You (Alex)',
    color: '#3B82F6', // Blue
    calendarData: {
      '2026-09-01': ['#3B82F6'],
      '2026-09-02': ['#3B82F6'],
      '2026-08-31': ['#3B82F6'],
      '2026-08-30': ['#3B82F6'],
    }
  };

  const member2: DuelMember = {
    id: 'u2',
    name: 'Sarah Kim',
    color: '#F59E0B', // Orange
    calendarData: {
      '2026-09-01': ['#F59E0B'],
      '2026-09-02': ['#F59E0B'],
      '2026-08-28': ['#F59E0B'],
    }
  };

  // Mock data for YearOverviewHeatmap
  const heatmapData = Array.from({ length: 364 }).map((_, i) => ({
    date: `2026-01-01`, // mock date
    count: Math.random() > 0.6 ? Math.floor(Math.random() * 5) : 0
  }));

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
        <Text variant="headingMd" color={COLORS.textPrimary} style={styles.headerTitle}>
          Streak Duel
        </Text>
        <View style={styles.iconBtnPlaceholder} />
      </View>

      <ComparativeView member1={member1} member2={member2} style={{ flex: 1 }} />

      {/* Temporarily rendering YearOverviewHeatmap here for demonstration */}
      <View style={styles.heatmapWrapper}>
        <YearOverviewHeatmap data={heatmapData} />
      </View>
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
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  iconBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgPanel,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.hairline,
  },
  iconBtnPlaceholder: {
    width: 40,
  },
  heatmapWrapper: {
    padding: SPACE.lg,
    paddingBottom: SPACE.xxl,
  }
});
