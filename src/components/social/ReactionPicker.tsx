import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { Text } from '../ui/Text';
import { COLORS, SPACE, RADIUS } from '@/constants/theme';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withSequence,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const EMOJIS = ['🔥', '💪', '👏', '❤️', '💯'];

type Props = {
  initialCounts?: Record<string, number>;
  userReaction?: string;
  onReact?: (emoji: string) => void;
};

// Reanimated handles basic styles well on Web, no need to disable unless it crashes
// const isWeb = Platform.OS === 'web';

function ReactionButton({ 
  emoji, 
  count, 
  isActive, 
  onPress 
}: { 
  emoji: string; 
  count: number; 
  isActive: boolean; 
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    onPress();
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    scale.value = withSequence(
      withSpring(1.4, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 400 })
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <View>
      <Pressable 
        onPress={handlePress}
        style={[
          styles.reactionButton,
          isActive && styles.reactionActive
        ]}
      >
        <Animated.Text style={[styles.emoji, animatedStyle]}>
          {emoji}
        </Animated.Text>
        {count > 0 && (
          <Text variant="caption" color={isActive ? COLORS.accentBlue : COLORS.textSecondary} style={styles.count}>
            {count}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

function FloatingReaction({ emoji, onComplete }: { emoji: string; onComplete: () => void }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0.5);

  React.useEffect(() => {
    scale.value = withSpring(2.5, { damping: 12 });
    translateY.value = withTiming(-80, { duration: 800, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(0, { duration: 800, easing: Easing.in(Easing.cubic) }, () => {
      runOnJS(onComplete)();
    });
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    top: -20,
    left: '50%',
    marginLeft: -12, // half of font size approx
    transform: [
      { translateY: translateY.value },
      { scale: scale.value }
    ],
    opacity: opacity.value,
    zIndex: 100,
  }));

  return (
    <Animated.Text style={[styles.emoji, style]} pointerEvents="none">
      {emoji}
    </Animated.Text>
  );
}

export function ReactionPicker({ initialCounts = {}, userReaction, onReact }: Props) {
  const [counts, setCounts] = useState(initialCounts);
  const [activeReaction, setActiveReaction] = useState<string | undefined>(userReaction);
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string }[]>([]);
  const reactionIdCounter = React.useRef(0);

  const handleReact = (emoji: string) => {
    setCounts(prev => {
      const newCounts = { ...prev };
      
      if (activeReaction === emoji) {
        // Toggle off
        newCounts[emoji] = Math.max(0, (newCounts[emoji] || 1) - 1);
        setActiveReaction(undefined);
      } else {
        // Switch or new
        if (activeReaction && newCounts[activeReaction]) {
          newCounts[activeReaction] = Math.max(0, newCounts[activeReaction] - 1);
        }
        newCounts[emoji] = (newCounts[emoji] || 0) + 1;
        setActiveReaction(emoji);
        
        // Trigger floating animation on new reaction
        const id = reactionIdCounter.current++;
        setFloatingEmojis(prev => [...prev, { id, emoji }]);
      }
      return newCounts;
    });
    
    onReact?.(emoji);
  };

  return (
    <View style={styles.container}>
      <View style={styles.pickerBg}>
        {EMOJIS.map(emoji => (
          <View key={emoji}>
            <ReactionButton
              emoji={emoji}
              count={counts[emoji] || 0}
              isActive={activeReaction === emoji}
              onPress={() => handleReact(emoji)}
            />
          </View>
        ))}
      </View>
      
      {/* Render floating animations globally for this picker */}
      {floatingEmojis.map(f => (
        <View key={f.id} style={StyleSheet.absoluteFill} pointerEvents="none">
          <FloatingReaction 
            emoji={f.emoji} 
            onComplete={() => setFloatingEmojis(prev => prev.filter(e => e.id !== f.id))} 
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  pickerBg: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgPanel,
    padding: SPACE.xs,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    gap: SPACE.xs,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.pill,
    gap: 4,
  },
  reactionActive: {
    backgroundColor: `${COLORS.accentBlue}15`,
  },
  emoji: {
    fontSize: 16,
  },
  count: {
    fontWeight: '600',
    fontSize: 13,
  }
});
