import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from './Text';
import { Avatar } from './Avatar';
import { CalendarGrid } from './CalendarGrid';
import { COLORS, RADIUS, SPACE } from '@/constants/theme';

export interface DuelMember {
  id: string;
  name: string;
  avatarUrl?: string;
  color: string;
  calendarData: Record<string, string[]>;
}

interface ComparativeViewProps {
  member1: DuelMember;
  member2: DuelMember;
  style?: any;
}

export function ComparativeView({ member1, member2, style }: ComparativeViewProps) {
  return (
    <View style={[styles.container, style]}>
      {/* VS Header */}
      <View style={styles.vsHeader}>
        <View style={styles.memberAvatarBox}>
          <View style={[styles.avatarGlow, { borderColor: member1.color }]} />
          <Avatar source={member1.avatarUrl} fallback={member1.name} size="xl" />
          <Text variant="label" color={COLORS.inkDisplay} style={styles.memberName} numberOfLines={1}>
            {member1.name}
          </Text>
        </View>

        <View style={styles.vsBadgeBox}>
          <Text variant="headingLg" color={COLORS.inkDisplay} style={styles.vsText}>VS</Text>
        </View>

        <View style={styles.memberAvatarBox}>
          <View style={[styles.avatarGlow, { borderColor: member2.color }]} />
          <Avatar source={member2.avatarUrl} fallback={member2.name} size="xl" />
          <Text variant="label" color={COLORS.inkDisplay} style={styles.memberName} numberOfLines={1}>
            {member2.name}
          </Text>
        </View>
      </View>

      {/* Calendars */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.calendarsWrapper}>
        <View style={styles.calendarCard}>
          <Text variant="label" color={member1.color} style={styles.calendarTitle}>
            {member1.name}'s Month
          </Text>
          <CalendarGrid data={member1.calendarData} style={styles.calendarInner} />
        </View>

        <View style={styles.calendarCard}>
          <Text variant="label" color={member2.color} style={styles.calendarTitle}>
            {member2.name}'s Month
          </Text>
          <CalendarGrid data={member2.calendarData} style={styles.calendarInner} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  vsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACE.xl,
    paddingHorizontal: SPACE.lg,
    backgroundColor: COLORS.surfaceElevated,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.hairline,
  },
  memberAvatarBox: {
    alignItems: 'center',
    width: 100,
  },
  avatarGlow: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderRadius: RADIUS.pill,
    width: 68, // slightly larger than xl avatar (64)
    height: 68,
    top: -2,
    left: 16,
    opacity: 0.8,
  },
  memberName: {
    marginTop: SPACE.sm,
    textAlign: 'center',
  },
  vsBadgeBox: {
    paddingHorizontal: SPACE.xl,
  },
  vsText: {
    fontStyle: 'italic',
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  calendarsWrapper: {
    padding: SPACE.lg,
    gap: SPACE.lg,
  },
  calendarCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    paddingTop: SPACE.md,
  },
  calendarTitle: {
    textAlign: 'center',
    marginBottom: SPACE.sm,
  },
  calendarInner: {
    backgroundColor: 'transparent',
    padding: SPACE.md,
  },
});
