import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import { useAuthStore } from '@/store/useAuthStore';

import { RootStackParamList } from '@/types';

// Group Screens
import CreateGroupScreen from '@/screens/Groups/CreateGroupScreen';
import JoinGroupScreen from '@/screens/Groups/JoinGroupScreen';
import GroupHomeScreen from '@/screens/Groups/GroupHomeScreen';
import GroupSettingsScreen from '@/screens/Groups/GroupSettingsScreen';
import CreateActivityScreen from '@/screens/Groups/CreateActivityScreen';
import ActivityDetailScreen from '@/screens/Groups/ActivityDetailScreen';
import SubmissionFlowScreen from '@/screens/Submission/SubmissionFlowScreen';
import ComparativeScreen from '@/screens/Groups/ComparativeScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Root navigator + auth gate.
 *
 * - When useAuthStore.isAuthenticated is false → show Auth stack
 *   (Splash decides whether to skip Onboarding based on AsyncStorage flag)
 * - When true → show Main tabs
 *
 * The auth state is driven entirely by useAuthSync (mounted in App.tsx),
 * which listens to supabase.auth.onAuthStateChange. This navigator does
 * not manage sessions — it just reads the result.
 */
export default function RootNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated || isLoading ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />

          {/* Group Stack */}
          <Stack.Screen
            name="CreateGroup"
            component={CreateGroupScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="JoinGroup"
            component={JoinGroupScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="GroupHome"
            component={GroupHomeScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="GroupSettings"
            component={GroupSettingsScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="CreateActivity"
            component={CreateActivityScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="ActivityDetail"
            component={ActivityDetailScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="SubmissionFlow"
            component={SubmissionFlowScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="Comparative"
            component={ComparativeScreen}
            options={{ animation: 'slide_from_bottom' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
