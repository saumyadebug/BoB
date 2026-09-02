import React, { useRef, useState } from 'react';
import { View, Pressable, Platform, StyleSheet, Animated } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/Main/HomeScreen';
import GroupsScreen from '../screens/Main/GroupsScreen';
import LeaderboardScreen from '../screens/Main/LeaderboardScreen';
import ProfileScreen from '../screens/Main/ProfileScreen';
import { COLORS, SHADOWS, RADIUS, EASE } from '@/constants/theme';
import { MainTabParamList } from '@/types';
import { Icon, IconName } from '@/components/ui';
import * as Haptics from 'expo-haptics';

const Tab = createBottomTabNavigator<MainTabParamList>();

// The center Submit tab doesn't have its own screen — it triggers a modal/sheet flow
const SubmitPlaceholder = () => null;

interface TactileSubmitProps {
  onPress: () => void;
}

function TactileSubmitPill({ onPress }: TactileSubmitProps) {
  const [pressed, setPressed] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    setPressed(true);
    Animated.spring(scale, { toValue: 0.92, useNativeDriver: true, damping: 18, stiffness: 320 }).start();
  };
  const pressOut = () => {
    setPressed(false);
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 320 }).start();
  };
  const handle = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    onPress();
  };

  return (
    <View style={styles.submitWrap}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPressIn={pressIn}
          onPressOut={pressOut}
          onPress={handle}
          style={[styles.submitPill, pressed ? styles.submitPillPressed : null]}
          accessibilityRole="button"
          accessibilityLabel="Submit"
        >
          <Icon name="plus" size={28} color="#FFFFFF" />
        </Pressable>
      </Animated.View>
    </View>
  );
}

function TabBarIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <Icon
      name={name}
      size={22}
      color={focused ? COLORS.inkDisplay : COLORS.inkTertiary}
      bold={focused}
    />
  );
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: COLORS.inkDisplay,
        tabBarInactiveTintColor: COLORS.inkTertiary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabBarIcon name="house" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Groups"
        component={GroupsScreen}
        options={{
          tabBarLabel: 'Pacts',
          tabBarIcon: ({ focused }) => <TabBarIcon name="users" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Submit"
        component={SubmitPlaceholder}
        options={({ navigation }: any) => ({
          tabBarLabel: () => null,
          tabBarButton: () => (
            <TactileSubmitPill onPress={() => {
              navigation.navigate('SubmissionFlow');
            }} />
          ),
        })}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{
          tabBarLabel: 'Rankings',
          tabBarIcon: ({ focused }) => <TabBarIcon name="trophy" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => <TabBarIcon name="user" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surfaceElevated,
    borderTopWidth: 1,
    borderTopColor: COLORS.hairline,
    height: Platform.OS === 'ios' ? 88 : 72,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    ...SHADOWS.card,
  },
  tabBarItem: {
    paddingTop: 4,
  },
  tabBarLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    marginTop: 4,
    letterSpacing: 0.1,
  },
  submitWrap: {
    top: -18,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitPill: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  submitPillPressed: {
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
  },
});
