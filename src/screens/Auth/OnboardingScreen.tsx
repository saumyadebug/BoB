import React, { useRef, useState } from 'react';
import { View, StyleSheet, FlatList, Dimensions, Animated, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, Icon, IconName } from '@/components/ui';
import { COLORS, RADIUS } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface Slide {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  accent: string;
}

const ONBOARDING_DATA: Slide[] = [
  {
    id: '1',
    title: 'Track together',
    description: 'Join a pact of up to six people. Show up daily. Hold each other to the standard.',
    icon: 'users',
    accent: '#FF5B1F',
  },
  {
    id: '2',
    title: 'Build the streak',
    description: 'A green dot every day. Miss one, and the streak resets. The calendar is the scoreboard.',
    icon: 'flame',
    accent: '#2E9D6A',
  },
  {
    id: '3',
    title: 'Earn your level',
    description: 'Every submission adds XP. Climb the ranks. Unlock badges. Become a legend in your pact.',
    icon: 'crown',
    accent: '#FF5B1F',
  },
];

export default function OnboardingScreen({ navigation }: any) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) setCurrentIndex(viewableItems[0].index);
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 60 }).current;

  const handleComplete = async () => {
    await AsyncStorage.setItem('onboarding_completed', 'true');
    navigation.replace('Login');
  };

  const handleNext = () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleComplete();
    }
  };

  const renderItem = ({ item, index }: { item: Slide; index: number }) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const translateX = scrollX.interpolate({
      inputRange,
      outputRange: [width * 0.3, 0, -width * 0.3],
    });
    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
      extrapolate: 'clamp',
    });
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.86, 1, 0.86],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.slide}>
        <Animated.View
          style={[
            styles.illustration,
            { transform: [{ translateX }, { scale }] },
          ]}
        >
          <View style={[styles.illustrationCore, { backgroundColor: hexToTint(item.accent, 0.10) }]}>
            <View style={[styles.illustrationInner, { backgroundColor: hexToTint(item.accent, 0.20) }]}>
              <Icon name={item.icon} size={84} color={item.accent} bold />
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.text, { opacity }]}>
          <Text variant="eyebrow" color={COLORS.textSecondary} style={styles.step}>
            Step {index + 1} of {ONBOARDING_DATA.length}
          </Text>
          <Text variant="displayMd" color={COLORS.textPrimary} style={styles.title}>
            {item.title}
          </Text>
          <Text variant="body" color={COLORS.textSecondary} style={styles.description}>
            {item.description}
          </Text>
        </Animated.View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {currentIndex < ONBOARDING_DATA.length - 1 ? (
          <Pressable onPress={handleComplete} hitSlop={8}>
            <Text variant="label" color={COLORS.textSecondary}>Skip</Text>
          </Pressable>
        ) : (
          <View />
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={ONBOARDING_DATA}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        scrollEventThrottle={16}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {ONBOARDING_DATA.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 28, 8],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i.toString()}
                style={[
                  styles.dot,
                  { width: dotWidth, opacity: dotOpacity, backgroundColor: COLORS.textPrimary },
                ]}
              />
            );
          })}
        </View>

        <Button
          label={currentIndex === ONBOARDING_DATA.length - 1 ? 'Get started' : 'Next'}
          onPress={handleNext}
          fullWidth
          size="lg"
          trailingIcon="arrow-right"
        />
      </View>
    </SafeAreaView>
  );
}

function hexToTint(hex: string, alpha: number) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgBase,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  slide: {
    width,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  illustration: {
    marginTop: 40,
    marginBottom: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationCore: {
    width: width - 120,
    height: width - 120,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationInner: {
    width: width - 200,
    height: width - 200,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    alignItems: 'center',
  },
  step: {
    marginBottom: 12,
  },
  title: {
    textAlign: 'center',
    marginBottom: 14,
  },
  description: {
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 320,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
    gap: 28,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
