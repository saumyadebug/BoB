import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, Card, Badge, Icon, IconName, ConfettiBurst, XPChip, CalendarGrid } from '@/components/ui';
import { COLORS, RADIUS, SPACE } from '@/constants/theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Activity, FieldDefinition } from '@/types';
import {
  useActivity,
  useArchiveActivity,
  useGroup,
  useActivitySubmissions,
  useDeclareRestDay,
  useConsumeStreakShield,
} from '@/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import { PRESET_ACTIVITIES } from '@/constants/activityTemplates';
import { DynamicForm } from '@/components/ui/DynamicForm';
import { BottomSheet } from '@/components/ui/BottomSheet';
import * as Haptics from 'expo-haptics';
import { isAppError } from '@/services/errors';

interface HistoryItem {
  id: string;
  userName: string;
  timestamp: string;
  summary: string;
  metrics?: Record<string, any>;
}

export default function ActivityDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const groupId: string = route.params?.groupId;
  const passedActivityId: string | undefined = route.params?.activityId;
  const passedActivity: Activity | undefined = route.params?.activity;

  const { data: fetchedActivity, isLoading } = useActivity(passedActivityId || '');
  const { data: groupData } = useGroup(groupId);
  const archiveActivityMut = useArchiveActivity(groupId);
  const declareRestDayMut = useDeclareRestDay();
  const consumeShieldMut = useConsumeStreakShield();
  const { user } = useAuthStore();
  const shieldsCount = user?.shieldsAvailable ?? 0;

  // Prefer the live fetch, fall back to the route param if passed
  const activity: Activity | undefined = fetchedActivity ?? passedActivity;
  const { data: activitySubmissions = [] } = useActivitySubmissions(activity?.id || '');

  const [activeTab, setActiveTab] = useState<'calendar' | 'history'>('calendar');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showXPChip, setShowXPChip] = useState(false);

  // Map activity submissions to calendar dates
  const activityCalendarData = React.useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const sub of activitySubmissions) {
      if (sub.clientTimestamp) {
        const dateKey = sub.clientTimestamp.slice(0, 10);
        map[dateKey] = [activity?.color || COLORS.positive];
      }
    }
    return map;
  }, [activitySubmissions, activity?.color]);

  // Loading + not-found guard
  if (!activity || (isLoading && !passedActivity)) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <Text variant="body" color={COLORS.textSecondary}>
            {isLoading ? 'Loading activity...' : 'Activity not found.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const matchedPreset = PRESET_ACTIVITIES.find(p => p.id === activity.templateKey);
  const fields: FieldDefinition[] = activity.templateFields && activity.templateFields.length > 0
    ? activity.templateFields
    : matchedPreset?.templateFields || [];

  const handleArchive = async () => {
    Alert.alert(
      'Archive Activity',
      'Are you sure you want to archive this activity? It will be hidden from the active list, but historical data will be preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: () => {
            archiveActivityMut.mutate(activity.id, {
              onSuccess: () => navigation.goBack(),
              onError: (err) => Alert.alert('Error', isAppError(err) ? err.message : (err as Error).message),
            });
          },
        },
      ]
    );
  };

  const handleFormSubmit = (data: Record<string, any>) => {
    setIsSubmittingForm(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    setTimeout(() => {
      setIsSubmittingForm(false);
      setShowSubmitModal(false);

      setShowCelebration(true);
      setShowXPChip(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }, 600);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Celebration Effects */}
      <ConfettiBurst isVisible={showCelebration} pieceCount={50} />
      {showXPChip && <XPChip xp={50} onAnimationEnd={() => setShowXPChip(false)} />}

      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <Icon name="arrow-left" size={20} color={COLORS.textPrimary} />
        </Pressable>
        <Text variant="headlineSm" color={COLORS.textPrimary}>Activity Details</Text>
        <Pressable onPress={handleArchive} style={styles.settingsBtn} hitSlop={8}>
          <Icon name="trash" size={20} color={COLORS.danger} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={[styles.heroIconBox, { backgroundColor: activity.color || COLORS.accentRed }]}>
            <Icon name={(activity.icon as IconName) || 'target'} size={36} color="#FFFFFF" bold />
          </View>
          <Text variant="headingLg" color={COLORS.textPrimary} style={styles.title}>
            {activity.name}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <Badge label={activity.frequency === 'daily' ? 'Daily' : 'Specific Days'} variant="primary" />
            {activity.requirePhoto && <Badge label="Photo Required" variant="secondary" icon="camera" />}
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <Card variant="glass" style={styles.statBox}>
            <Text variant="monoMd" color={COLORS.accentRed}>14d</Text>
            <Text variant="caption" color={COLORS.textSecondary} style={{ marginTop: 2 }}>Streak</Text>
          </Card>
          <Card variant="glass" style={styles.statBox}>
            <Text variant="monoMd" color={COLORS.positive}>92%</Text>
            <Text variant="caption" color={COLORS.textSecondary} style={{ marginTop: 2 }}>Completion</Text>
          </Card>
          <Card variant="glass" style={styles.statBox}>
            <Text variant="monoMd" color={COLORS.textPrimary}>+50 XP</Text>
            <Text variant="caption" color={COLORS.textSecondary} style={{ marginTop: 2 }}>Per Log</Text>
          </Card>
        </View>

        {/* Tracked Fields Card */}
        {fields.length > 0 && (
          <Card variant="glass" style={styles.fieldsCard}>
            <Text variant="headingSm" color={COLORS.textPrimary} style={{ marginBottom: 12 }}>
              Tracked Metrics ({fields.length})
            </Text>
            <View style={styles.fieldChipsRow}>
              {fields.map(f => (
                <View key={f.id} style={styles.fieldChip}>
                  <Text variant="caption" color={COLORS.textPrimary} style={{ fontWeight: '600' }}>
                    {f.label} {f.unit ? `(${f.unit})` : ''}
                  </Text>
                  <Text variant="caption" color={COLORS.textSecondary} style={{ fontSize: 10, marginTop: 2 }}>
                    {f.type}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Rest Day & Shield Action Buttons */}
        <View style={styles.actionRow}>
          {activity.restDaysPerWeek > 0 && (
            <Button
              label="Declare Rest Day 🛌"
              variant="secondary"
              size="sm"
              onPress={async () => {
                const today = new Date().toISOString().slice(0, 10);
                try {
                  await declareRestDayMut.mutateAsync({ activityId: activity.id, targetDate: today });
                  Alert.alert('Rest Day Declared 🛌', 'Your streak is protected for today. Enjoy your rest!');
                } catch (err: any) {
                  Alert.alert('Cannot Declare Rest Day', err.message || 'Rest day limit reached (max 2/week).');
                }
              }}
              style={{ flex: 1 }}
            />
          )}
          <Button
            label={`Use Shield (${shieldsCount}) 🛡️`}
            variant="secondary"
            size="sm"
            onPress={() => {
              if (shieldsCount <= 0) {
                Alert.alert('No Shields', 'You do not have any streak shields available. Earn shields by maintaining a 7-day streak!');
                return;
              }
              const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
              Alert.alert(
                'Deploy Streak Shield 🛡️',
                'Use 1 shield to protect your streak from a missed day? (Max 1 shield per week)',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Use Shield',
                    onPress: async () => {
                      try {
                        await consumeShieldMut.mutateAsync({ activityId: activity.id, missedDate: yesterday });
                        Alert.alert('Streak Protected 🛡️', 'Your streak has been restored!');
                      } catch (err: any) {
                        Alert.alert('Shield Error', err.message || 'Could not deploy shield.');
                      }
                    },
                  },
                ]
              );
            }}
            style={{ flex: 1 }}
          />
        </View>

        {/* Quick Submit CTA */}
        <View style={{ marginVertical: 12 }}>
          <Button
            label="Log Today's Session 🚀"
            variant="primary"
            leadingIcon="plus"
            onPress={() => {
              try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
              navigation.navigate('SubmissionFlow', {
                activityId: activity.id,
                groupId: activity.groupId || groupId,
              });
            }}
          />
        </View>

        {/* Subtabs: Calendar vs History */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'calendar' && styles.activeTab]}
            onPress={() => {
              try { Haptics.selectionAsync(); } catch {}
              setActiveTab('calendar');
            }}
          >
            <Text
              variant="label"
              color={activeTab === 'calendar' ? COLORS.textPrimary : COLORS.textTertiary}
            >
              Calendar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
            onPress={() => {
              try { Haptics.selectionAsync(); } catch {}
              setActiveTab('history');
            }}
          >
            <Text
              variant="label"
              color={activeTab === 'history' ? COLORS.textPrimary : COLORS.textTertiary}
            >
              History ({activitySubmissions.length})
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContent}>
          {activeTab === 'calendar' ? (
            <CalendarGrid data={activityCalendarData} />
          ) : (
            <View style={{ gap: 12 }}>
              {activitySubmissions.length === 0 ? (
                <Card variant="glass" style={styles.placeholderContainer}>
                  <Text variant="bodySm" color={COLORS.textSecondary} style={{ textAlign: 'center' }}>
                    No submission history yet for this activity. Log your first proof!
                  </Text>
                </Card>
              ) : (
                activitySubmissions.map((item) => (
                  <Card key={item.id} variant="glass" style={styles.historyCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text variant="headingSm" color={COLORS.textPrimary}>
                        {item.title || 'Completed Session'}
                      </Text>
                      <Text variant="caption" color={COLORS.textSecondary}>
                        {item.clientTimestamp?.slice(0, 10)}
                      </Text>
                    </View>
                    {item.description ? (
                      <Text variant="bodySm" color={COLORS.textSecondary}>
                        {item.description}
                      </Text>
                    ) : null}
                  </Card>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Dynamic Form Bottom Sheet */}
      <BottomSheet
        isVisible={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
      >
        <Text variant="headingLg" color={COLORS.textPrimary} style={{ marginBottom: 4, textAlign: 'center' }}>
          Log {activity.name}
        </Text>
        <Text variant="caption" color={COLORS.textSecondary} style={{ textAlign: 'center', marginBottom: 20 }}>
          Fill in today's details to lock in your streak!
        </Text>

        <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
          {fields.length > 0 ? (
            <DynamicForm
              fields={fields}
              onSubmit={handleFormSubmit}
              submitLabel="Confirm & Submit"
              isSubmitting={isSubmittingForm}
            />
          ) : (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Text variant="body" color={COLORS.textSecondary} style={{ marginBottom: 20 }}>
                No custom fields required for this activity.
              </Text>
              <Button
                label="Confirm & Submit"
                variant="primary"
                onPress={() => handleFormSubmit({})}
                disabled={isSubmittingForm}
              />
            </View>
          )}
        </ScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgBase,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.hairline,
  },
  backBtn: {
    padding: 6,
  },
  settingsBtn: {
    padding: 6,
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 20,
  },
  heroIconBox: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.squircle,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    marginBottom: 6,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  fieldsCard: {
    marginBottom: 16,
    padding: 16,
  },
  fieldChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fieldChip: {
    backgroundColor: COLORS.bgSurface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.hairline,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgPanel,
    borderRadius: RADIUS.pill,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.hairline,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: RADIUS.pill,
  },
  activeTab: {
    backgroundColor: COLORS.bgSurface,
  },
  tabContent: {
    flex: 1,
  },
  placeholderContainer: {
    padding: 20,
    alignItems: 'center',
  },
  miniHeatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    width: '100%',
  },
  heatDot: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.xs,
  },
  historyCard: {
    padding: 16,
  },
});
