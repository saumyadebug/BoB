import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Animated } from 'react-native';
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
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
      ])
    ).start();
  }, []);

  return (
    <View style={[styles.container, style]}>
      {/* VS Header */}
      <View style={styles.vsHeader}>
        <View style={styles.memberAvatarBox}>
          <View style={[styles.avatarGlow, { borderColor: member1.color }]} />
          <Avatar source={member1.avatarUrl} name={member1.name} size="xl" />
          <Text variant="label" color={COLORS.textPrimary} style={styles.memberName} numberOfLines={1}>
            {member1.name}
          </Text>
        </View>

        <Animated.View style={[styles.vsBadgeBox, { transform: [{ scale: pulseAnim }] }]}>
          <Text variant="displaySm" color={COLORS.accentRed} style={styles.vsText}>VS</Text>
        </Animated.View>

        <View style={styles.memberAvatarBox}>
          <View style={[styles.avatarGlow, { borderColor: member2.color }]} />
          <Avatar source={member2.avatarUrl} name={member2.name} size="xl" />
          <Text variant="label" color={COLORS.textPrimary} style={styles.memberName} numberOfLines={1}>
            {member2.name}
          </Text>
        </View>
      </View>

      {/* Calendars */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.calendarsWrapper}>
        <View style={styles.sideBySide}>
          <View style={styles.calendarCard}>
            <Text variant="label" color={member1.color} style={styles.calendarTitle}>
              {member1.name}
            </Text>
            <CalendarGrid data={member1.calendarData} style={styles.calendarInner} />
          </View>

          <View style={styles.calendarCard}>
            <Text variant="label" color={member2.color} style={styles.calendarTitle}>
              {member2.name}
            </Text>
            <CalendarGrid data={member2.calendarData} style={styles.calendarInner} />
          </View>
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
    backgroundColor: COLORS.bgPanel,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.hairline,
  },
  memberAvatarBox: {
    alignItems: 'center',
    width: 100,
  },
  avatarGlow: {
    ...StyleSheet.absoluteFill,
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
  },
  sideBySide: {
    flexDirection: 'row',
    gap: SPACE.lg,
    justifyContent: 'space-between',
  },
  calendarCard: {
    flex: 1,
    backgroundColor: COLORS.bgPanel,
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
