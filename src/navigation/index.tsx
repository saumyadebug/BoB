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

export default function RootNavigator() {
  const { isAuthenticated } = useAuthStore(); 

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
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
