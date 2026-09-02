import React, { useState } from 'react';
import { View, StyleSheet, Text, Pressable, SafeAreaView, Platform, KeyboardAvoidingView, ScrollView, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Activity } from '@/types';
import { COLORS, TYPOGRAPHY, SPACE, RADIUS, SHADOWS } from '@/constants/theme';
import { Icon } from '@/components/ui/Icon';
import { DynamicForm } from '@/components/ui/DynamicForm';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PreviewCard } from '@/components/ui/PreviewCard';
import { PRESET_ACTIVITIES } from '@/constants/activityTemplates';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

type Props = NativeStackScreenProps<RootStackParamList, 'SubmissionFlow'>;
type Step = 'ACTIVITY_SELECT' | 'CAMERA' | 'FORM' | 'DETAILS' | 'CONFIRM' | 'SUCCESS';

export default function SubmissionFlowScreen({ navigation, route }: Props) {
  const [step, setStep] = useState<Step>(route.params?.activityId ? 'CAMERA' : 'ACTIVITY_SELECT');
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => navigation.goBack();
  const handleSelectActivity = () => { setSelectedActivity(PRESET_ACTIVITIES[0]); setStep('CAMERA'); };

  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      alert("You've refused to allow this app to access your camera!");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 5],
      quality: 1,
    });
    if (!result.canceled) {
      await processImage(result.assets[0].uri);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 1,
    });
    if (!result.canceled) {
      await processImage(result.assets[0].uri);
    }
  };

  const processImage = async (uri: string) => {
    setIsCompressing(true);
    try {
      // Compress to max 1080px width, 80% quality JPEG
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: Math.min(1080, 2000) } }], // Just forcing a max width, keeping aspect ratio
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      setPhotoUri(manipResult.uri);
    } catch (e) {
      console.log('Compression failed', e);
      setPhotoUri(uri); // fallback to original
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSkipPhoto = () => {
    setPhotoUri(null);
    setStep('FORM');
  };

  const renderHeader = (title: string, showBack = true) => (
    <View style={styles.header}>
      {showBack && step !== 'ACTIVITY_SELECT' && step !== 'SUCCESS' ? (
        <Pressable 
          style={styles.headerBtn} 
          onPress={() => {
            if (step === 'CAMERA') setStep('ACTIVITY_SELECT');
            else if (step === 'FORM') setStep('CAMERA');
            else if (step === 'DETAILS') setStep('FORM');
            else if (step === 'CONFIRM') setStep('DETAILS');
          }}>
          <Icon name="arrow-left" size={24} color={COLORS.inkBase} />
        </Pressable>
      ) : (
        <View style={styles.headerBtn} />
      )}
      <Text style={styles.headerTitle}>{title}</Text>
      <Pressable style={styles.headerBtn} onPress={handleClose}>
        <Icon name="x" size={24} color={COLORS.inkBase} />
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {step === 'ACTIVITY_SELECT' && (
          <View style={styles.stepContainer}>
            {renderHeader('Select Activity', false)}
            <View style={styles.content}>
              <Text style={styles.placeholderText}>Activity Selector UI will go here.</Text>
              <Pressable style={styles.mockBtn} onPress={handleSelectActivity}>
                <Text style={styles.mockBtnText}>Select Mock Activity (Gym)</Text>
              </Pressable>
            </View>
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
                      <Text style={styles.secondaryBtnText}>Remove</Text>
                    </Pressable>
                    <Pressable style={styles.primaryBtn} onPress={() => setStep('FORM')}>
                      <Text style={styles.primaryBtnText}>Looks Good!</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <>
                  <Icon name="camera" size={64} color={COLORS.inkTertiary} />
                  <Text style={[styles.placeholderText, { marginTop: SPACE.md }]}>Show the crew you did it!</Text>
                  
                  <View style={styles.cameraButtons}>
                    <Pressable style={styles.primaryBtn} onPress={handleTakePhoto}>
                      <Icon name="camera" size={20} color={COLORS.surfaceMain} />
                      <Text style={[styles.primaryBtnText, { marginLeft: SPACE.sm }]}>Take Photo</Text>
                    </Pressable>
                    <Pressable style={styles.secondaryBtn} onPress={handlePickImage}>
                      <Icon name="image" size={20} color={COLORS.inkBase} />
                      <Text style={[styles.secondaryBtnText, { marginLeft: SPACE.sm }]}>Gallery</Text>
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
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.stepContainer}>
            {renderHeader('Details')}
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
              {selectedActivity?.templateFields ? (
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
                  <Text style={styles.placeholderText}>No fields defined for this activity.</Text>
                  <Pressable style={styles.mockBtn} onPress={() => setStep('DETAILS')}>
                    <Text style={styles.mockBtnText}>Continue</Text>
                  </Pressable>
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        )}
        {step === 'DETAILS' && (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.stepContainer}>
            {renderHeader('Title & Notes')}
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
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
                {['Felt heavy today 🥵', 'Crushed it! 💪', 'New PR 🏆'].map(chip => (
                  <Pressable key={chip} style={styles.suggestionChip} onPress={() => setDescription(prev => (prev ? prev + ' ' + chip : chip))}>
                    <Text variant="caption" color={COLORS.inkPrimary}>{chip}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={{ marginTop: 24 }}>
                <Button label="Review Submission" onPress={() => setStep('CONFIRM')} fullWidth />
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
                  onPress={() => {
                    setIsSubmitting(true);
                    setTimeout(() => {
                      setIsSubmitting(false);
                      setStep('SUCCESS');
                    }, 1000);
                  }}
                  disabled={isSubmitting}
                  fullWidth 
                />
              </View>
            </ScrollView>
          </View>
        )}
        {step === 'SUCCESS' && (
          <View style={[styles.stepContainer, styles.centerContent]}>
            <Text style={styles.successEmoji}>🎉</Text>
            <Text style={styles.successTitle}>Crushed It!</Text>
            <Text style={styles.successSubtitle}>+60 XP 🔥</Text>
            <Pressable style={styles.mockBtn} onPress={handleClose}>
              <Text style={styles.mockBtnText}>Back to Feed</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.surfaceMain },
  container: { flex: 1 },
  stepContainer: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACE.lg, paddingTop: Platform.OS === 'android' ? SPACE.xl : SPACE.md, paddingBottom: SPACE.md, borderBottomWidth: 1, borderBottomColor: COLORS.hairline },
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...TYPOGRAPHY.h3, color: COLORS.inkDisplay },
  content: { flex: 1, padding: SPACE.xl, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: SPACE.xl, paddingBottom: 100 },
  fieldWrapper: { marginBottom: 24 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  suggestionChip: { backgroundColor: COLORS.surfaceElevated, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLORS.hairline },
  centerContent: { justifyContent: 'center', alignItems: 'center', padding: SPACE.xl },
  placeholderText: { ...TYPOGRAPHY.body, color: COLORS.inkTertiary, marginBottom: SPACE.xl, textAlign: 'center' },
  mockBtn: { backgroundColor: COLORS.accent, paddingHorizontal: SPACE.xl, paddingVertical: SPACE.md, borderRadius: RADIUS.round, ...SHADOWS.raised },
  mockBtnText: { ...TYPOGRAPHY.button, color: COLORS.surfaceMain },
  primaryBtn: { backgroundColor: COLORS.accent, paddingHorizontal: SPACE.xl, paddingVertical: SPACE.md, borderRadius: RADIUS.round, ...SHADOWS.raised, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1, marginHorizontal: SPACE.xs },
  primaryBtnText: { ...TYPOGRAPHY.button, color: COLORS.surfaceMain },
  secondaryBtn: { backgroundColor: COLORS.surfaceElevated, paddingHorizontal: SPACE.xl, paddingVertical: SPACE.md, borderRadius: RADIUS.round, borderWidth: 1, borderColor: COLORS.hairlineStrong, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1, marginHorizontal: SPACE.xs },
  secondaryBtnText: { ...TYPOGRAPHY.button, color: COLORS.inkBase },
  cameraButtons: { flexDirection: 'row', width: '100%', marginBottom: SPACE.xl, paddingHorizontal: SPACE.md },
  skipBtn: { padding: SPACE.md },
  skipBtnText: { ...TYPOGRAPHY.body, color: COLORS.inkTertiary, textDecorationLine: 'underline' },
  previewContainer: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },
  previewImage: { width: '100%', aspectRatio: 4/5, borderRadius: RADIUS.lg, marginBottom: SPACE.xl, ...SHADOWS.card },
  previewActions: { flexDirection: 'row', width: '100%', paddingHorizontal: SPACE.md },
  successEmoji: { fontSize: 72, marginBottom: SPACE.md },
  successTitle: { ...TYPOGRAPHY.h1, color: COLORS.inkDisplay, marginBottom: SPACE.xs },
  successSubtitle: { ...TYPOGRAPHY.h2, color: COLORS.accent, marginBottom: SPACE.xxl },
});
