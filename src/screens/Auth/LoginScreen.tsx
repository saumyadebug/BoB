import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Input, Button } from '@/components/ui';
import { COLORS } from '@/constants/theme';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormValues } from '@/validation/auth';
import { supabase } from '@/services/supabase';
import { signInWithGoogle, isGoogleConfigured } from '@/services/googleAuth';
import { useAuthStore } from '@/store/useAuthStore';
import { storage } from '@/utils/storage';
import { VoltMark } from '@/components/brand/VoltMark';
import { AppError, isAppError } from '@/services/errors';

type LoginForm = LoginFormValues;

function mapSupabaseAuthError(err: any): AppError {
  const message = err?.message?.toLowerCase() ?? '';
  if (message.includes('invalid login') || message.includes('invalid credentials')) {
    return new AppError('INVALID_CREDENTIALS', 'Email and password do not match.');
  }
  if (message.includes('email not confirmed')) {
    return new AppError('NOT_AUTHENTICATED', 'Please verify your email first.');
  }
  return new AppError('NETWORK', err?.message || 'Sign in failed.');
}

export default function LoginScreen({ navigation }: any) {
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { setSession } = useAuthStore();

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) throw mapSupabaseAuthError(error);

      if (signInData.session) {
        await storage.setItem('streakpact_jwt', signInData.session.access_token);
        setSession(signInData.session);
        // The onAuthStateChange listener (1.5.6) will hydrate the user row.
        // Navigation happens automatically in the root navigator.
      }
    } catch (e: any) {
      if (isAppError(e)) {
        setAuthError(e.message);
      } else {
        setAuthError(e?.message || 'Sign in failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (!isGoogleConfigured()) {
      setAuthError('Google sign-in not configured. Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to .env');
      return;
    }
    setAuthError(null);
    setIsLoading(true);
    try {
      await signInWithGoogle();
      // useAuthSync will pick up the session and the navigator will swap stacks.
    } catch (e: any) {
      if (isAppError(e) && e.code === 'NOT_ALLOWED') {
        // User cancelled â€” no error UI.
      } else {
        setAuthError(e?.message || 'Google sign-in failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuest = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw mapSupabaseAuthError(error);
      if (data.session) {
        await storage.setItem('streakpact_jwt', data.session.access_token);
        setSession(data.session);
      }
    } catch (e: any) {
      setAuthError(e?.message || 'Guest sign-in failed.');
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
            <Text variant="displaySm" color={COLORS.textPrimary} style={styles.brandWord}>
              Streak<Text style={{ color: COLORS.accentBlue }}>Pact</Text>
            </Text>
          </View>

          <View style={styles.header}>
            <Text variant="headingLg" color={COLORS.textPrimary}>Welcome back</Text>
            <Text variant="body" color={COLORS.textSecondary} style={styles.subtitle}>
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
              label={isLoading ? 'Signing inâ€¦' : 'Sign in'}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              loading={isLoading}
              fullWidth
              size="lg"
              style={styles.submit}
            />

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text variant="caption" color={COLORS.textTertiary} style={styles.dividerText}>OR</Text>
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
            <Text variant="body" color={COLORS.textSecondary}>New here? </Text>
            <Pressable onPress={() => navigation.navigate('Register')}>
              <Text variant="bodyMedium" color={COLORS.accentBlue}>Create an account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgBase },
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
