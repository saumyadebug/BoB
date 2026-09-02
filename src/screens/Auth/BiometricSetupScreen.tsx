import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, Icon } from '@/components/ui';
import { COLORS, RADIUS } from '@/constants/theme';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function BiometricSetupScreen({ navigation }: any) {
  const [biometricType, setBiometricType] = useState<'Face ID' | 'Touch ID' | 'Biometrics'>('Biometrics');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsSupported(compatible);
      if (compatible) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('Face ID');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('Touch ID');
        }
      }
    })();
  }, []);

  const handleEnable = async () => {
    try {
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Enable ${biometricType} for StreakPact`,
        fallbackLabel: 'Use passcode',
      });
      if (result.success) {
        await AsyncStorage.setItem('biometrics_enabled', 'true');
      }
    } finally {
      navigation.replace('JoinOrCreate');
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('biometrics_enabled', 'false');
    navigation.replace('JoinOrCreate');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconBox}>
          <Icon
            name={biometricType === 'Face ID' ? 'user' : 'fingerprint'}
            size={48}
            color={COLORS.accentBlue}
          />
        </View>

        <Text variant="eyebrow" color={COLORS.textSecondary} style={styles.step}>Step 2 of 2</Text>
        <Text variant="displaySm" color={COLORS.textPrimary} style={styles.title}>
          Quick, secure access
        </Text>
        <Text variant="body" color={COLORS.textSecondary} style={styles.description}>
          Use {biometricType} to sign in faster. Your streaks stay private to you.
        </Text>

        <View style={styles.actions}>
          <Button
            label={`Enable ${biometricType}`}
            onPress={handleEnable}
            disabled={!isSupported}
            fullWidth
            size="lg"
            leadingIcon="shield-check"
          />
          <View style={{ height: 10 }} />
          <Button
            label="Skip for now"
            variant="ghost"
            onPress={handleSkip}
            fullWidth
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgBase },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: 96,
    height: 96,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  step: { marginBottom: 8 },
  title: { textAlign: 'center', marginBottom: 12 },
  description: {
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    maxWidth: 320,
  },
  actions: { width: '100%' },
});
