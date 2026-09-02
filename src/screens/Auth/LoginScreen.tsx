import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Input, Button } from '@/components/ui';
import { COLORS } from '@/constants/theme';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseAuth } from '@/services/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import { storage } from '@/utils/storage';
import { VoltMark } from '@/components/brand/VoltMark';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen({ navigation }: any) {
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useAuthStore();

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, data.email, data.password);
      const token = await userCredential.user.getIdToken();
      await storage.setItem('streakpact_jwt', token);
      setUser({
        id: userCredential.user.uid,
        email: userCredential.user.email || '',
        username: 'You',
        displayName: userCredential.user.displayName || 'You',
        avatarUrl: userCredential.user.photoURL || null,
        level: 1, xp: 0, shieldsAvailable: 0,
        totalSubmissions: 0, longestStreak: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential') {
        setAuthError('Email and password do not match.');
      } else if (error.code === 'auth/user-not-found') {
        setAuthError('No account with that email.');
      } else if (error.code === 'auth/wrong-password') {
        setAuthError('Incorrect password.');
      } else {
        setAuthError(error.message || 'Sign in failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = () => {
    setAuthError('Google sign-in coming soon.');
  };

  const handleGuest = async () => {
    setIsLoading(true);
    try {
      await storage.setItem('streakpact_jwt', 'guest-token');
      setUser({
        id: 'guest-' + Date.now(),
        email: 'guest@streakpact.app',
        username: 'Guest',
        displayName: 'Guest',
        avatarUrl: null,
        level: 1, xp: 0, shieldsAvailable: 3,
        totalSubmissions: 0, longestStreak: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.kb}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brand}>
            <VoltMark size={56} withHalo />
            <Text variant="displaySm" color={COLORS.inkDisplay} style={styles.brandWord}>
              Streak<Text style={{ color: COLORS.accent }}>Pact</Text>
            </Text>
          </View>

          <View style={styles.header}>
            <Text variant="headingLg" color={COLORS.inkDisplay}>Welcome back</Text>
            <Text variant="body" color={COLORS.inkSecondary} style={styles.subtitle}>
              Sign in to keep your streak going.
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
                  autoComplete="email"
                  textContentType="emailAddress"
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
                  placeholder="Your password"
                  secureTextEntry
                  autoComplete="password"
                  textContentType="password"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.password?.message}
                />
              )}
            />

            {authError ? (
              <Text variant="bodySm" color={COLORS.danger} style={styles.errorText}>
                {authError}
              </Text>
            ) : null}

            <Button
              label={isLoading ? 'Signing in…' : 'Sign in'}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              loading={isLoading}
              fullWidth
              size="lg"
              style={styles.submit}
            />

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text variant="caption" color={COLORS.inkTertiary} style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              label="Continue with Google"
              variant="secondary"
              leadingIcon="arrow-up-right"
              onPress={handleGoogle}
              fullWidth
            />
            <View style={{ height: 10 }} />
            <Button
              label="Continue as guest"
              variant="ghost"
              onPress={handleGuest}
              fullWidth
              disabled={isLoading}
            />
          </View>

          <View style={styles.footer}>
            <Text variant="body" color={COLORS.inkSecondary}>New here? </Text>
            <Pressable onPress={() => navigation.navigate('Register')}>
              <Text variant="bodyMedium" color={COLORS.accent}>Create an account</Text>
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
  brand: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 40,
  },
  brandWord: {
    marginTop: 14,
  },
  header: { marginBottom: 28 },
  subtitle: { marginTop: 6 },
  form: { width: '100%' },
  errorText: { marginTop: 12, textAlign: 'center' },
  submit: { marginTop: 24 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.hairline,
  },
  dividerText: { letterSpacing: 1.5 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
});
