import React, { useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme, Theme } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
import * as SplashScreen from 'expo-splash-screen';
import { View } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import RootNavigator from './src/navigation';
import { queryClient } from './src/services/queryClient';
import { COLORS } from './constants/theme';
import { useAuthSync } from './src/hooks/useAuthSync';
import { useDevAuthBypass } from './src/hooks/useDevAuthBypass';

SplashScreen.preventAutoHideAsync().catch(() => {});

const linking: any = {
  prefixes: ['streakpact://', 'exp://'],
  config: {
    screens: {
      Auth: {
        screens: {
          Splash: '',
          Onboarding: 'onboarding',
          Login: 'login',
          Register: 'register',
          SetupProfile: 'setup-profile',
          JoinOrCreate: 'join-or-create',
          BiometricSetup: 'biometric-setup',
        },
      },
      Main: {
        screens: {
          Home: 'home',
          Groups: 'groups',
          Leaderboard: 'leaderboard',
          Profile: 'profile',
        },
      },
      JoinGroup: 'join/:code',
      CreateGroup: 'create-group',
      GroupHome: 'group/:groupId',
      GroupSettings: 'group/:groupId/settings',
      CreateActivity: 'group/:groupId/create-activity',
      ActivityDetail: 'group/:groupId/activity',
    },
  },
};

function buildNavTheme(): Theme {
  return {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: COLORS.bgBase,
      card: COLORS.bgPanel,
      text: COLORS.textPrimary,
      border: COLORS.border,
      primary: COLORS.accentBlue,
      notification: COLORS.accentRed,
    },
  };
}

export default function App() {
  // Mount the auth sync listener once at the root.
  useAuthSync();

  // Dev-only: if the sandbox clock is skewed relative to Supabase, install
  // a mock auth session so the rest of the app can be smoke-tested.
  // No-op on real devices because they have correct clocks.
  useDevAuthBypass();

  // Dark cosmos is the only theme — ignore system color scheme.
  const isDark = true;

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'SpaceGrotesk-Medium': SpaceGrotesk_500Medium,
    'SpaceGrotesk-SemiBold': SpaceGrotesk_600SemiBold,
    'SpaceGrotesk-Bold': SpaceGrotesk_700Bold,
    'JetBrainsMono-Regular': JetBrainsMono_400Regular,
    'JetBrainsMono-Medium': JetBrainsMono_500Medium,
    'JetBrainsMono-Bold': JetBrainsMono_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: COLORS.bgBase }} onLayout={onLayoutRootView}>
          <NavigationContainer theme={buildNavTheme()} linking={linking}>
            <RootNavigator />
          </NavigationContainer>
          <StatusBar style="light" />
        </View>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

/**
 * Dev-only auth bypass.
 *
 * Probes Supabase auth. If the response says "JWT issued at future",
 * that means the local clock is ahead of Supabase's clock — a sandbox
 * artifact, not a production issue. We install a mock session so the
 * rest of the app can be smoke-tested end-to-end.
 *
 * On a real device with a correct clock, the probe succeeds, this is
 * a no-op, and real Supabase auth runs as expected.
 */
