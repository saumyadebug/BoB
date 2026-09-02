import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, Icon, IconName } from '@/components/ui';
import { COLORS, SIZES, SHADOWS, RADIUS, SPACE } from '@/constants/theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { PRESET_ACTIVITIES, ActivityTemplate } from '@/constants/activityTemplates';
import { useAddActivity } from '@/hooks';
import { isAppError } from '@/services/errors';
import { activityTemplateService, ActivityCategory } from '@/services/activityTemplateService';

const ACTIVITY_ICONS: Record<string, IconName> = {
  gym: 'barbell',
  study: 'book',
  read: 'book',
  run: 'rocket',
  meditate: 'leaf',
  water: 'drop',
  code: 'code',
  sleep: 'moon',
  music: 'music-notes',
};

export default function CreateActivityScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const groupId = route.params?.groupId;

  const addActivity = useAddActivity(groupId);
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<ActivityTemplate | null>(null);

  const [frequency, setFrequency] = useState<'daily' | 'specific_days'>('daily');
  const [requirePhoto, setRequirePhoto] = useState(false);

  const handleSelectTemplate = (template: ActivityTemplate) => {
    setSelectedTemplate(template);
    setRequirePhoto(template.requirePhoto);
    setFrequency(template.frequency === 'daily' ? 'daily' : 'specific_days');
    setStep(2);
  };

  const handleCreate = () => {
    if (!selectedTemplate || !groupId) return;

    addActivity.mutate(
      {
        name: selectedTemplate.name,
        icon: selectedTemplate.icon,
        color: selectedTemplate.color,
        templateKey: selectedTemplate.id,
        templateFields: selectedTemplate.templateFields,
        frequency: frequency,
        frequencyDays: frequency === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : [1, 3, 5],
        requirePhoto: requirePhoto,
      },
      {
        onSuccess: () => navigation.goBack(),
        onError: (err) => {
          Alert.alert(
            'Error',
            isAppError(err) ? err.message : (err as Error).message || 'Failed to add activity'
          );
        },
      }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (step > 1 ? setStep(step - 1) : navigation.goBack())}
          style={styles.backBtn}
          hitSlop={6}
        >
          <Icon name="arrow-left" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text variant="eyebrow" color={COLORS.textSecondary}>
          {step === 1 ? 'Choose activity' : 'Configure'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {step === 1 && (
          <View>
            <Text variant="displaySm" color={COLORS.textPrimary} style={styles.title}>
              What do you want to track?
            </Text>
            <Text variant="body" color={COLORS.textSecondary} style={styles.subtitle}>
              Select a preset or create your own.
            </Text>

            {/* Group templates by category so the picker is scannable */}
            {(['fitness', 'learning', 'mindfulness', 'productivity', 'lifestyle'] as ActivityCategory[]).map(cat => {
              const inCat = PRESET_ACTIVITIES.filter(t => {
                // Re-use the same mapping as the service
                const map: Record<string, ActivityCategory> = {
                  gym: 'fitness', run: 'fitness',
                  study: 'learning', read: 'learning', language: 'learning', code: 'productivity',
                  meditate: 'mindfulness',
                  water: 'lifestyle', coldShower: 'lifestyle', music: 'lifestyle',
                };
                return (map[t.id] ?? 'lifestyle') === cat;
              });
              if (inCat.length === 0) return null;
              return (
                <View key={cat} style={{ marginBottom: 16 }}>
                  <Text variant="eyebrow" color={COLORS.textTertiary} style={styles.categoryLabel}>
                    {cat.toUpperCase()}
                  </Text>
                  <View style={styles.grid}>
                    {inCat.map(tpl => {
                      const iconName = ACTIVITY_ICONS[tpl.id] || 'target';
                      return (
                        <TouchableOpacity
                          key={tpl.id}
                          style={styles.templateCard}
                          onPress={() => handleSelectTemplate(tpl)}
                          activeOpacity={0.85}
                        >
                          <View style={[styles.templateHeader, { backgroundColor: tpl.color }]}>
                            <Icon name={iconName} size={28} color="#FFFFFF" />
                          </View>
                          <View style={styles.templateContent}>
                            <Text variant="headingMd" color={COLORS.textPrimary}>{tpl.name}</Text>
                            <Text variant="caption" color={COLORS.textSecondary} style={styles.templateDesc}>
                              {tpl.description}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}

            {/* Suppress unused warning for the service â€” it's imported for future use */}
            {activityTemplateService && null}
          </View>
        )}

        {step === 2 && selectedTemplate && (
          <View>
            <View style={styles.configHeader}>
              <View style={[styles.configIconBox, { backgroundColor: selectedTemplate.color }]}>
                <Icon
                  name={ACTIVITY_ICONS[selectedTemplate.id] || 'target'}
                  size={32}
                  color="#FFFFFF"
                />
              </View>
              <Text variant="displaySm" color={COLORS.textPrimary} style={{ marginTop: 16 }}>
                {selectedTemplate.name}
              </Text>
            </View>

            <View style={styles.configSection}>
              <Text variant="headingMd" color={COLORS.textPrimary} style={styles.sectionTitle}>
                Frequency
              </Text>
              <View style={styles.row}>
                <TouchableOpacity
                  style={[styles.chip, frequency === 'daily' && styles.chipActive]}
                  onPress={() => setFrequency('daily')}
                >
                  <Text style={frequency === 'daily' ? styles.chipTextActive : undefined}>
                    Daily
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.chip, frequency === 'specific_days' && styles.chipActive]}
                  onPress={() => setFrequency('specific_days')}
                >
                  <Text style={frequency === 'specific_days' ? styles.chipTextActive : undefined}>
                    Specific days
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.configSection}>
              <Text variant="headingMd" color={COLORS.textPrimary} style={styles.sectionTitle}>
                Proof
              </Text>
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium" color={COLORS.textPrimary}>Require photo</Text>
                  <Text variant="caption" color={COLORS.textSecondary}>
                    Members must upload a photo to submit.
                  </Text>
                </View>
                <Switch
                  value={requirePhoto}
                  onValueChange={setRequirePhoto}
                  trackColor={{ false: COLORS.hairlineStrong, true: COLORS.accentBlue }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor={COLORS.hairlineStrong}
                />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {step === 2 && (
        <View style={styles.footer}>
          <Button
            label={addActivity.isPending ? 'Addingâ€¦' : 'Add to pact'}
            onPress={handleCreate}
            disabled={addActivity.isPending}
            loading={addActivity.isPending}
            fullWidth
            size="lg"
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgBase },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.bgPanel,
    borderWidth: 1, borderColor: COLORS.hairline,
  },
  content: { padding: SPACE.xl, paddingBottom: 120 },
  title: { marginTop: 12, marginBottom: 8 },
  subtitle: { lineHeight: 22, marginBottom: 24 },
  categoryLabel: { marginBottom: 8, marginTop: 8 },
  grid: { gap: 12 },
  templateCard: {
    backgroundColor: COLORS.bgPanel,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    overflow: 'hidden',
  },
  templateHeader: {
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateContent: { padding: 16 },
  templateDesc: { marginTop: 4, lineHeight: 18 },
  configHeader: { alignItems: 'center', marginBottom: 32 },
  configIconBox: {
    width: 80, height: 80, borderRadius: RADIUS.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  configSection: { marginBottom: 28 },
  sectionTitle: { marginBottom: 12 },
  row: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgPanel,
    borderWidth: 1, borderColor: COLORS.hairline,
  },
  chipActive: { backgroundColor: COLORS.textPrimary, borderColor: COLORS.textPrimary },
  chipTextActive: { color: COLORS.bgBase },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  footer: {
    padding: SPACE.xl, paddingBottom: 36,
    borderTopWidth: 1, borderTopColor: COLORS.hairline,
    backgroundColor: COLORS.bgBase,
  },
});
