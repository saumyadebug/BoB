import React from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Text } from './Text';
import { COLORS, SPACE, RADIUS } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { mockTodayActivities } from '@/hooks/useMockFeed';
import { useNavigation } from '@react-navigation/native';

export function TodayBanner() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <Text variant="headingMd" color={COLORS.textPrimary} style={styles.title}>
        Today
      </Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {mockTodayActivities.map((activity) => {
          const isPending = activity.status === 'pending';
          // Calculate progress bounded between 0 and 1
          const progressRaw = activity.currentValue / activity.limitValue;
          const progress = Math.min(Math.max(progressRaw, 0), 1);
          
          return (
            <Pressable 
              key={activity.id}
              onPress={() => {
                navigation.navigate('SubmissionFlow', { activityId: activity.id });
              }}
              style={({ pressed }) => [
                styles.activityCard,
                pressed && styles.pressed
              ]}
            >
              {/* Header: Icon & Name */}
              <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: `${activity.color}20` }]}>
                    <MaterialCommunityIcons 
                      name={activity.icon as any} 
                      size={18} 
                      color={activity.color} 
                    />
                  </View>
                  <Text variant="body" color={COLORS.textPrimary} style={styles.activityName} numberOfLines={1}>
                    {activity.name}
                  </Text>
                </View>
              </View>

              {/* Progress Text & Status Badge */}
              <View style={styles.statsRow}>
                <View style={styles.progressTextWrap}>
                  <Text variant="headingSm" color={COLORS.textPrimary}>
                    {activity.currentValue}
                  </Text>
                  <Text variant="caption" color={COLORS.textSecondary}>
                    {' '} / {activity.limitValue} {activity.unit}
                  </Text>
                </View>

                <View style={[
                  styles.statusBadge, 
                  { backgroundColor: isPending ? `${COLORS.warning}15` : `${COLORS.success}15` }
                ]}>
                  <Text 
                    variant="caption" 
                    style={{ 
                      color: isPending ? COLORS.warning : COLORS.success,
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      fontSize: 10
                    }}
                  >
                    {isPending ? 'Pending' : 'Done'}
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarBg}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { 
                      width: `${progress * 100}%`,
                      backgroundColor: isPending ? activity.color : COLORS.success 
                    }
                  ]} 
                />
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACE.md,
    backgroundColor: COLORS.bgBase,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.hairline,
  },
  title: {
    paddingHorizontal: SPACE.lg,
    marginBottom: SPACE.sm,
  },
  scrollContent: {
    paddingHorizontal: SPACE.lg,
    gap: SPACE.md, // slightly larger gap for cards
  },
  activityCard: {
    width: 220,
    backgroundColor: COLORS.bgPanel,
    padding: SPACE.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    gap: SPACE.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityName: {
    fontWeight: '600',
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressTextWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: COLORS.bgSurface,
    borderRadius: 3,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  }
});
