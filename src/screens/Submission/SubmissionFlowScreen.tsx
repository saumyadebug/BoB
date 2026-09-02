import React, { useState } from 'react';
import { View, StyleSheet, Text, Pressable, SafeAreaView, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Activity } from '@/types';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/constants/theme';
import { Icon } from '@/components/ui/Icon';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'SubmissionFlow'>;
type Step = 'ACTIVITY_SELECT' | 'CAMERA' | 'FORM' | 'CONFIRM' | 'SUCCESS';

export default function SubmissionFlowScreen({ navigation, route }: Props) {
  const [step, setStep] = useState<Step>(route.params?.activityId ? 'CAMERA' : 'ACTIVITY_SELECT');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const handleClose = () => navigation.goBack();
  const handleSelectActivity = (activity: any) => { setSelectedActivity(activity); setStep('CAMERA'); };

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
            else if (step === 'CONFIRM') setStep('FORM');
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
              <Pressable style={styles.mockBtn} onPress={() => handleSelectActivity({ id: 'mock' })}>
                <Text style={styles.mockBtnText}>Select Mock Activity</Text>
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
                  <Text style={[styles.placeholderText, { marginTop: SPACING.md }]}>Show the crew you did it!</Text>
                  
                  <View style={styles.cameraButtons}>
                    <Pressable style={styles.primaryBtn} onPress={handleTakePhoto}>
                      <Icon name="camera" size={20} color={COLORS.surfaceMain} />
                      <Text style={[styles.primaryBtnText, { marginLeft: SPACING.sm }]}>Take Photo</Text>
                    </Pressable>
                    <Pressable style={styles.secondaryBtn} onPress={handlePickImage}>
                      <Icon name="image" size={20} color={COLORS.inkBase} />
                      <Text style={[styles.secondaryBtnText, { marginLeft: SPACING.sm }]}>Gallery</Text>
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
          <View style={styles.stepContainer}>
            {renderHeader('Details')}
            <View style={styles.content}>
              <Text style={styles.placeholderText}>Dynamic Form UI will go here.</Text>
              <Pressable style={styles.mockBtn} onPress={() => setStep('CONFIRM')}>
                <Text style={styles.mockBtnText}>Continue</Text>
              </Pressable>
            </View>
          </View>
        )}
        {step === 'CONFIRM' && (
          <View style={styles.stepContainer}>
            {renderHeader('Confirm')}
            <View style={styles.content}>
              <Text style={styles.placeholderText}>Preview Card will go here.</Text>
              <Pressable style={styles.mockBtn} onPress={() => setStep('SUCCESS')}>
                <Text style={styles.mockBtnText}>Submit StreakPact 🚀</Text>
              </Pressable>
            </View>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingTop: Platform.OS === 'android' ? SPACING.xl : SPACING.md, paddingBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.hairline },
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...TYPOGRAPHY.h3, color: COLORS.inkDisplay },
  content: { flex: 1, padding: SPACING.xl, justifyContent: 'center', alignItems: 'center' },
  centerContent: { justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  placeholderText: { ...TYPOGRAPHY.body, color: COLORS.inkTertiary, marginBottom: SPACING.xl, textAlign: 'center' },
  mockBtn: { backgroundColor: COLORS.accent, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: RADIUS.round, ...SHADOWS.raised },
  mockBtnText: { ...TYPOGRAPHY.button, color: COLORS.surfaceMain },
  primaryBtn: { backgroundColor: COLORS.accent, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: RADIUS.round, ...SHADOWS.raised, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1, marginHorizontal: SPACING.xs },
  primaryBtnText: { ...TYPOGRAPHY.button, color: COLORS.surfaceMain },
  secondaryBtn: { backgroundColor: COLORS.surfaceElevated, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: RADIUS.round, borderWidth: 1, borderColor: COLORS.hairlineStrong, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1, marginHorizontal: SPACING.xs },
  secondaryBtnText: { ...TYPOGRAPHY.button, color: COLORS.inkBase },
  cameraButtons: { flexDirection: 'row', width: '100%', marginBottom: SPACING.xl, paddingHorizontal: SPACING.md },
  skipBtn: { padding: SPACING.md },
  skipBtnText: { ...TYPOGRAPHY.body, color: COLORS.inkTertiary, textDecorationLine: 'underline' },
  previewContainer: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },
  previewImage: { width: '100%', aspectRatio: 4/5, borderRadius: RADIUS.lg, marginBottom: SPACING.xl, ...SHADOWS.card },
  previewActions: { flexDirection: 'row', width: '100%', paddingHorizontal: SPACING.md },
  successEmoji: { fontSize: 72, marginBottom: SPACING.md },
  successTitle: { ...TYPOGRAPHY.h1, color: COLORS.inkDisplay, marginBottom: SPACING.xs },
  successSubtitle: { ...TYPOGRAPHY.h2, color: COLORS.accent, marginBottom: SPACING.xxl },
});
