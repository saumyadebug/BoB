import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Input, Button, PasswordStrengthMeter } from '@/components/ui';
import { COLORS } from '@/constants/theme';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterFormValues, evaluatePasswordStrength } from '@/validation/auth';
import { supabase } from '@/services/supabase';
import { signInWithGoogle, isGoogleConfigured } from '@/services/googleAuth';
import { useAuthStore } from '@/store/useAuthStore';
import { storage } from '@/utils/storage';
import { VoltMark } from '@/components/brand/VoltMark';
import { AppError, isAppError } from '@/services/errors';

type RegisterForm = RegisterFormValues;

function mapSupabaseAuthError(err: any): AppError {
  const message = err?.message?.toLowerCase() ?? '';
  if (message.includes('already registered') || message.includes('already been registered')) {
    return new AppError('EMAIL_IN_USE', 'An account with this email already exists.');
  }
  if (message.includes('weak password') || message.includes('password should be')) {
    return new AppError('WEAK_PASSWORD', 'Choose a stronger password.');
  }
  return new AppError('NETWORK', err?.message || 'Sign up failed.');
}

export default function RegisterScreen({ navigation }: any) {
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { setSession } = useAuthStore();

  const { control, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });
  const passwordValue = watch('password');
  const passwordStrength = evaluatePasswordStrength(passwordValue);

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { display_name: data.email.split('@')[0] },
        },
      });
      if (error) throw mapSupabaseAuthError(error);

      if (signUpData.session) {
        await storage.setItem('streakpact_jwt', signUpData.session.access_token);
        setSession(signUpData.session);
        navigation.replace('SetupProfile');
      } else {
        // Email confirmation required â€” surface a message.
        setAuthError('Check your email to verify your account, then sign in.');
      }
    } catch (e: any) {
      if (isAppError(e)) {
        setAuthError(e.message);
      } else {
        setAuthError(e?.message || 'Sign up failed.');
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
            <Text variant="headingLg" color={COLORS.textPrimary}>Create your account</Text>
            <Text variant="body" color={COLORS.textSecondary} style={styles.subtitle}>
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
                <View>
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
                  {value.length > 0 && (
                    <PasswordStrengthMeter
                      strength={passwordStrength.strength}
                      label={passwordStrength.label}
                    />
                  )}
                </View>
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
              label={isLoading ? 'Creating accountâ€¦' : 'Create account'}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              loading={isLoading}
              fullWidth
              size="lg"
              style={styles.submit}
            />
          </View>

          <View style={styles.footer}>
            <Text variant="body" color={COLORS.textSecondary}>Have an account? </Text>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text variant="bodyMedium" color={COLORS.accentBlue}>Sign in</Text>
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
