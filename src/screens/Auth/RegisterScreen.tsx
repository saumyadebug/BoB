import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Input, Button } from '@/components/ui';
import { COLORS } from '@/constants/theme';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseAuth } from '@/services/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import { storage } from '@/utils/storage';
import { VoltMark } from '@/components/brand/VoltMark';

const registerSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterScreen({ navigation }: any) {
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useAuthStore();

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, data.email, data.password);
      const token = await userCredential.user.getIdToken();
      await storage.setItem('streakpact_jwt', token);
      setUser({
        id: userCredential.user.uid,
        email: userCredential.user.email || '',
        displayName: 'You',
        username: 'You',
        avatarUrl: null,
        level: 1, xp: 0, shieldsAvailable: 3,
        totalSubmissions: 0, longestStreak: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      navigation.replace('SetupProfile');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setAuthError('An account with this email already exists.');
      } else {
        setAuthError(error.message || 'Sign up failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.kb}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brand}>
            <VoltMark size={48} />
          </View>

          <View style={styles.header}>
            <Text variant="headingLg" color={COLORS.inkDisplay}>Create your account</Text>
            <Text variant="body" color={COLORS.inkSecondary} style={styles.subtitle}>
              It takes about thirty seconds.
            </Text>
          </View>

          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  placeholder="you@email.com"
                  leadingIcon="user"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.email?.message}
                />
              )}
            />
            <View style={{ height: 14 }} />
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="At least 6 characters"
                  secureTextEntry
                  hint="6+ characters, mix it up"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.password?.message}
                />
              )}
            />
            <View style={{ height: 14 }} />
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirm password"
                  placeholder="Type it again"
                  secureTextEntry
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.confirmPassword?.message}
                />
              )}
            />

            {authError ? (
              <Text variant="bodySm" color={COLORS.danger} style={styles.errorText}>
                {authError}
              </Text>
            ) : null}

            <Button
              label={isLoading ? 'Creating account…' : 'Create account'}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              loading={isLoading}
              fullWidth
              size="lg"
              style={styles.submit}
            />
          </View>

          <View style={styles.footer}>
            <Text variant="body" color={COLORS.inkSecondary}>Have an account? </Text>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text variant="bodyMedium" color={COLORS.accent}>Sign in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surfaceBase },
  kb: { flex: 1 },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    flexGrow: 1,
  },
  brand: { alignItems: 'center', marginTop: 8, marginBottom: 40 },
  header: { marginBottom: 28 },
  subtitle: { marginTop: 6 },
  form: { width: '100%' },
  errorText: { marginTop: 12, textAlign: 'center' },
  submit: { marginTop: 24 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
});
