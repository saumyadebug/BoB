import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Activity } from '@/types';
import { COLORS, TYPOGRAPHY, SPACE, RADIUS, SHADOWS } from '@/constants/theme';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { DynamicForm } from '@/components/ui/DynamicForm';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PreviewCard } from '@/components/ui/PreviewCard';
import { ConfettiBurst, XPChip, VoltPeek } from '@/components/ui';
import * as Haptics from 'expo-haptics';
import { PRESET_ACTIVITIES } from '@/constants/activityTemplates';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useAuthStore } from '@/store/useAuthStore';
import { useCreateSubmission } from '@/hooks/useSubmissions';
import { useSubmissionQueue } from '@/store/useSubmissionQueue';
import { uploadSubmissionPhoto } from '@/services/storageService';
import { useUserGroups } from '@/hooks';
import { useGroupActivities, useActivity } from '@/hooks/useActivities';
import { isAppError } from '@/services/errors';

type Props = NativeStackScreenProps<RootStackParamList, 'SubmissionFlow'>;
type Step = 'ACTIVITY_SELECT' | 'CAMERA' | 'FORM' | 'DETAILS' | 'CONFIRM' | 'SUCCESS';

export default function SubmissionFlowScreen({ navigation, route }: Props) {
  const initialActivityId = route.params?.activityId;
  const initialGroupId = route.params?.groupId;

  const [step, setStep] = useState<Step>(initialActivityId ? 'CAMERA' : 'ACTIVITY_SELECT');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [earnedXp, setEarnedXp] = useState(60);

  const { user } = useAuthStore();
  const createSubmissionMutation = useCreateSubmission();
  const { addSubmission } = useSubmissionQueue();

  // Load user groups to show their real activities
  const { data: userGroups = [], isLoading: groupsLoading } = useUserGroups();
  const activeGroupId = initialGroupId || selectedActivity?.groupId || userGroups[0]?.id;
  const { data: groupActivities = [] } = useGroupActivities(activeGroupId || '');
  const { data: routeActivity } = useActivity(initialActivityId || '');

  useEffect(() => {
    if (routeActivity) {
      setSelectedActivity(routeActivity);
    } else if (initialActivityId && groupActivities.length > 0) {
      const found = groupActivities.find((a) => a.id === initialActivityId);
      if (found) setSelectedActivity(found);
    }
  }, [routeActivity, initialActivityId, groupActivities]);

  const handleClose = () => navigation.goBack();

  const handleSelectActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    setStep('CAMERA');
  };

  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', "You've refused to allow this app to access your camera!");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      await processImage(result.assets[0].uri);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      await processImage(result.assets[0].uri);
    }
  };

  const processImage = async (uri: string) => {
    setIsCompressing(true);
    try {
      // Compress to max 1080px width, 80% quality JPEG
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: Math.min(1080, 2000) } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      setPhotoUri(manipResult.uri);
    } catch (e) {
      console.log('Compression failed', e);
      setPhotoUri(uri);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSkipPhoto = () => {
    setPhotoUri(null);
    setStep('FORM');
  };

  const handleSubmit = async () => {
    if (!selectedActivity) {
      Alert.alert('Error', 'Please select an activity first.');
      return;
    }

    const groupId = selectedActivity.groupId || activeGroupId;
    if (!groupId) {
      Alert.alert('Error', 'No group found for this activity.');
      return;
    }

    setIsSubmitting(true);
    let uploadedPhotoUrl: string | null = null;

    try {
      // 1. Upload photo if present
      if (photoUri) {
        try {
          uploadedPhotoUrl = await uploadSubmissionPhoto(
            user?.id || 'anonymous',
            selectedActivity.id,
            photoUri
          );
        } catch (photoErr) {
          console.warn('[SubmissionFlow] Photo upload failed, continuing to queue:', photoErr);
        }
      }

      // 2. Call real createSubmission mutation
      const result = await createSubmissionMutation.mutateAsync({
        activityId: selectedActivity.id,
        groupId,
        photoUrl: uploadedPhotoUrl,
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        fieldValues: formData,
        clientTimestamp: new Date().toISOString(),
      });

      setEarnedXp(result.xpEarned || 60);
      setStep('SUCCESS');
    } catch (err: any) {
      console.warn('[SubmissionFlow] Submission error:', err);

      if (isAppError(err) && err.code === 'DUPLICATE_SUBMISSION') {
        Alert.alert('Already Logged Today', err.message);
      } else {
        // Queue for offline background sync
        addSubmission({
          id: `sub_${Date.now()}`,
          activityId: selectedActivity.id,
          groupId,
          timestamp: new Date().toISOString(),
          title: title.trim() || undefined,
          description: description.trim() || undefined,
          fieldsData: formData,
          photoUri: photoUri || undefined,
        });

        setEarnedXp(60);
        Alert.alert(
          'Saved Offline',
          'Your proof has been saved and will sync automatically once network connectivity is restored.'
        );
        setStep('SUCCESS');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderHeader = (headerTitle: string, showBack = true) => (
    <View style={styles.header}>
      {showBack && step !== 'ACTIVITY_SELECT' && step !== 'SUCCESS' ? (
        <Pressable
          style={styles.headerBtn}
          onPress={() => {
            if (step === 'CAMERA') setStep('ACTIVITY_SELECT');
            else if (step === 'FORM') setStep('CAMERA');
            else if (step === 'DETAILS') setStep('FORM');
            else if (step === 'CONFIRM') setStep('DETAILS');
          }}
          hitSlop={8}
        >
          <Icon name="arrow-left" size={24} color={COLORS.textPrimary} />
        </Pressable>
      ) : (
        <View style={styles.headerBtn} />
      )}
      <Text style={styles.headerTitle}>{headerTitle}</Text>
      <Pressable style={styles.headerBtn} onPress={handleClose} hitSlop={8}>
        <Icon name="x" size={24} color={COLORS.textPrimary} />
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {step === 'ACTIVITY_SELECT' && (
          <View style={styles.stepContainer}>
            {renderHeader('Select Activity', false)}
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <Text style={styles.sectionSubtitle}>
                Choose which activity you're completing proof for:
              </Text>

              {groupsLoading ? (
                <View style={styles.centerContent}>
                  <ActivityIndicator color={COLORS.accentBlue} size="large" />
                </View>
              ) : groupActivities.length > 0 ? (
                groupActivities.map((act) => (
                  <Pressable
                    key={act.id}
                    style={styles.activityItem}
                    onPress={() => handleSelectActivity(act)}
                  >
                    <View
                      style={[
                        styles.activityIconBox,
                        { backgroundColor: act.color || COLORS.brandPrimary },
                      ]}
                    >
                      <Text style={styles.activityIconText}>{act.icon || '⚡'}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: SPACE.md }}>
                      <Text variant="headingSm" color={COLORS.textPrimary}>
                        {act.name}
                      </Text>
                      <Text variant="caption" color={COLORS.textSecondary}>
                        {act.frequency === 'daily' ? 'Every day' : 'Custom schedule'}
                      </Text>
                    </View>
                    <Icon name="arrow-right" size={20} color={COLORS.textTertiary} />
                  </Pressable>
                ))
              ) : (
                <>
                  <Text style={[styles.placeholderText, { marginBottom: SPACE.lg }]}>
                    No pact activities found. Select a preset template to submit:
                  </Text>
                  {PRESET_ACTIVITIES.slice(0, 4).map((preset) => {
                    const mockAct: Activity = {
                      id: `preset_${preset.id}`,
                      groupId: activeGroupId || 'default-group',
                      name: preset.name,
                      icon: preset.icon,
                      color: preset.color,
                      templateKey: preset.id,
                      frequency: 'daily',
                      frequencyDays: [0, 1, 2, 3, 4, 5, 6],
                      restDaysPerWeek: 1,
                      requirePhoto: false,
                      templateFields: preset.templateFields as any,
                      isArchived: false,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    };
                    return (
                      <Pressable
                        key={preset.id}
                        style={styles.activityItem}
                        onPress={() => handleSelectActivity(mockAct)}
                      >
                        <View
                          style={[
                            styles.activityIconBox,
                            { backgroundColor: preset.color },
                          ]}
                        >
                          <Text style={styles.activityIconText}>{preset.icon}</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: SPACE.md }}>
                          <Text variant="headingSm" color={COLORS.textPrimary}>
                            {preset.name}
                          </Text>
                          <Text variant="caption" color={COLORS.textSecondary}>
                            Preset template
                          </Text>
                        </View>
                        <Icon name="arrow-right" size={20} color={COLORS.textTertiary} />
                      </Pressable>
                    );
                  })}
                </>
              )}
            </ScrollView>
          </View>
        )}

        {step === 'CAMERA' && (
          <View style={styles.stepContainer}>
            {renderHeader('Photo Proof')}
            <View style={styles.content}>
              {photoUri ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: photoUri }} style={styles.previewImage} />
                  <View style={styles.previewActions}>
                    <Pressable style={styles.secondaryBtn} onPress={() => setPhotoUri(null)}>
                      <Text style={styles.secondaryBtnText}>Retake</Text>
                    </Pressable>
                    <Pressable style={styles.primaryBtn} onPress={() => setStep('FORM')}>
                      <Text style={styles.primaryBtnText}>Looks Good!</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <>
                  <Icon name="camera" size={64} color={COLORS.textTertiary} />
                  <Text style={[styles.placeholderText, { marginTop: SPACE.md }]}>
                    Show the crew you did it!
                  </Text>

                  <View style={styles.cameraButtons}>
                    <Pressable style={styles.primaryBtn} onPress={handleTakePhoto}>
                      <Icon name="camera" size={20} color={COLORS.bgBase} />
                      <Text style={[styles.primaryBtnText, { marginLeft: SPACE.sm }]}>
                        Take Photo
                      </Text>
                    </Pressable>
                    <Pressable style={styles.secondaryBtn} onPress={handlePickImage}>
                      <Icon name="image" size={20} color={COLORS.textPrimary} />
                      <Text style={[styles.secondaryBtnText, { marginLeft: SPACE.sm }]}>
                        Gallery
                      </Text>
                    </Pressable>
                  </View>

                  <Pressable style={styles.skipBtn} onPress={handleSkipPhoto}>
                    <Text style={styles.skipBtnText}>Skip Photo</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        )}

        {step === 'FORM' && (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.stepContainer}
          >
            {renderHeader('Details')}
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {selectedActivity?.templateFields && selectedActivity.templateFields.length > 0 ? (
                <DynamicForm
                  fields={selectedActivity.templateFields}
                  submitLabel="Continue"
                  onSubmit={(data) => {
                    setFormData(data);
                    setStep('DETAILS');
                  }}
                />
              ) : (
                <View style={styles.content}>
                  <Text style={styles.placeholderText}>No extra fields required.</Text>
                  <Button label="Continue" onPress={() => setStep('DETAILS')} fullWidth />
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        )}

        {step === 'DETAILS' && (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.stepContainer}
          >
            {renderHeader('Title & Notes')}
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.fieldWrapper}>
                <Input
                  label="Title (Optional)"
                  placeholder="e.g. Morning Workout"
                  value={title}
                  onChangeText={setTitle}
                  maxLength={80}
                  showCharCount
                />
              </View>
              <View style={styles.fieldWrapper}>
                <Input
                  label="Description (Optional)"
                  placeholder="How did it go? Share some thoughts..."
                  value={description}
                  onChangeText={setDescription}
                  maxLength={500}
                  multiline
                  showCharCount
                  style={{ minHeight: 120, textAlignVertical: 'top' }}
                />
              </View>
              <View style={styles.chipsRow}>
                {['Felt heavy today 🥵', 'Crushed it! 💪', 'New PR 🏆', 'Consistency wins 🔥'].map(
                  (chip) => (
                    <Pressable
                      key={chip}
                      style={styles.suggestionChip}
                      onPress={() =>
                        setDescription((prev) => (prev ? `${prev} ${chip}` : chip))
                      }
                    >
                      <Text variant="caption" color={COLORS.textPrimary}>
                        {chip}
                      </Text>
                    </Pressable>
                  )
                )}
              </View>
              <View style={{ marginTop: 24 }}>
                <Button
                  label="Review Submission"
                  onPress={() => setStep('CONFIRM')}
                  fullWidth
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        )}

        {step === 'CONFIRM' && (
          <View style={styles.stepContainer}>
            {renderHeader('Confirm')}
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <PreviewCard
                activityName={selectedActivity?.name || 'Activity'}
                activityIcon={selectedActivity?.icon || '⚡'}
                activityColor={selectedActivity?.color || COLORS.brandPrimary}
                photoUri={photoUri}
                title={title}
                description={description}
                formData={formData}
              />
              <View style={{ marginTop: 32 }}>
                <Button
                  label={isSubmitting ? 'Submitting...' : 'Submit StreakPact 🚀'}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  fullWidth
                />
              </View>
            </ScrollView>
          </View>
        )}

        {step === 'SUCCESS' && (
          <View style={[styles.stepContainer, styles.centerContent]}>
            <ConfettiBurst isVisible={true} pieceCount={60} />
            <XPChip xp={earnedXp} />
            <View style={{ marginBottom: SPACE.lg }}>
              <VoltPeek size={96} />
            </View>
            <Text variant="headingLg" color={COLORS.textPrimary} style={styles.successTitle}>
              Proof Locked In!
            </Text>
            <Text variant="body" color={COLORS.textSecondary} style={{ textAlign: 'center', marginTop: 8, marginBottom: SPACE.xl, maxWidth: 280 }}>
              Your squad streak is protected and your proof has been shared to the pact feed.
            </Text>
            <Button
              label="Back to Feed ⚡"
              variant="primary"
              size="lg"
              onPress={() => {
                try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
                handleClose();
              }}
              style={{ minWidth: 220 }}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bgBase },
  container: { flex: 1 },
  stepContainer: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.lg,
    paddingTop: Platform.OS === 'android' ? SPACE.md : 0,
    paddingBottom: SPACE.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.hairline,
  },
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...TYPOGRAPHY.headlineSm, color: COLORS.textPrimary },
  content: { flex: 1, padding: SPACE.xl, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: SPACE.xl, paddingBottom: 100 },
  sectionSubtitle: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.textSecondary,
    marginBottom: SPACE.lg,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgPanel,
    padding: SPACE.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACE.sm,
    borderWidth: 1,
    borderColor: COLORS.hairline,
  },
  activityIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityIconText: { fontSize: 22 },
  fieldWrapper: { marginBottom: 24 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  suggestionChip: {
    backgroundColor: COLORS.bgPanel,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.hairline,
  },
  centerContent: { justifyContent: 'center', alignItems: 'center', padding: SPACE.xl },
  placeholderText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textTertiary,
    marginBottom: SPACE.xl,
    textAlign: 'center',
  },
  mockBtn: {
    backgroundColor: COLORS.accentBlue,
    paddingHorizontal: SPACE.xl,
    paddingVertical: SPACE.md,
    borderRadius: RADIUS.full,
    ...SHADOWS.raised,
  },
  mockBtnText: { ...TYPOGRAPHY.label, color: COLORS.bgBase },
  primaryBtn: {
    backgroundColor: COLORS.accentBlue,
    paddingHorizontal: SPACE.xl,
    paddingVertical: SPACE.md,
    borderRadius: RADIUS.full,
    ...SHADOWS.raised,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: SPACE.xs,
  },
  primaryBtnText: { ...TYPOGRAPHY.label, color: COLORS.bgBase },
  secondaryBtn: {
    backgroundColor: COLORS.bgPanel,
    paddingHorizontal: SPACE.xl,
    paddingVertical: SPACE.md,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: SPACE.xs,
  },
  secondaryBtnText: { ...TYPOGRAPHY.label, color: COLORS.textPrimary },
  cameraButtons: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: SPACE.xl,
    paddingHorizontal: SPACE.md,
  },
  skipBtn: { padding: SPACE.md },
  skipBtnText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textTertiary,
    textDecorationLine: 'underline',
  },
  previewContainer: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },
  previewImage: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: RADIUS.lg,
    marginBottom: SPACE.xl,
    ...SHADOWS.card,
  },
  previewActions: { flexDirection: 'row', width: '100%', paddingHorizontal: SPACE.md },
  successEmoji: { fontSize: 72, marginBottom: SPACE.md },
  successTitle: {
    ...TYPOGRAPHY.displaySm,
    color: COLORS.textPrimary,
    marginBottom: SPACE.xs,
  },
  successSubtitle: {
    ...TYPOGRAPHY.headline,
    color: COLORS.accentBlue,
    marginBottom: SPACE.xxl,
  },
});
