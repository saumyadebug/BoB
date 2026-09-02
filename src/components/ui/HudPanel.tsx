import React from 'react';
import { View, StyleSheet, Pressable, ViewStyle, StyleProp } from 'react-native';
import { Text } from './Text';
import { Icon, IconName } from './Icon';
import { COLORS, RADIUS, SPACE } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

export interface HudPanelProps {
  statusText?: string;
  timerLabel?: string;
  timerValue?: string;
  actionIcon?: IconName;
  onActionPress?: () => void;
  onPlayPausePress?: () => void;
  isPlaying?: boolean;
  leftStat?: { label: string; value: string | number };
  rightStat?: { label: string; value: string | number };
  style?: StyleProp<ViewStyle>;
}

export function HudPanel({
  statusText = 'Tracking activity now...',
  timerLabel = 'Timer',
  timerValue = '02:14',
  actionIcon = 'check',
  onActionPress,
  onPlayPausePress,
  isPlaying = false,
  leftStat,
  rightStat,
  style,
}: HudPanelProps) {
  const handleAction = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    onActionPress?.();
  };

  const handlePlayPause = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onPlayPausePress?.();
  };

  return (
    <View style={[styles.container, style]}>
      {/* Top Status Header */}
      {statusText && (
        <View style={styles.statusRow}>
          <Text variant="caption" color={COLORS.textSecondary} style={styles.statusText}>
            {statusText}
          </Text>
        </View>
      )}

      {/* Main Timer & Action Halo Card */}
      <View style={styles.mainRow}>
        {/* Left Timer Readout */}
        <View style={styles.timerBlock}>
          <Text variant="caption" color={COLORS.textTertiary} style={styles.timerLabel}>
            {timerLabel}
          </Text>
          <Text variant="monoLg" color={COLORS.textPrimary} style={styles.timerValue}>
            {timerValue}
          </Text>
        </View>

        {/* Right Action Trigger with Circular Halo */}
        <Pressable
          onPress={handleAction}
          style={({ pressed }) => [
            styles.actionRing,
            pressed && { transform: [{ scale: 0.94 }] },
          ]}
          accessibilityRole="button"
        >
          <View style={styles.actionInner}>
            <Icon name={actionIcon} size={18} color="#FFFFFF" />
          </View>
        </Pressable>
      </View>

      {/* Scrubber / Media HUD Controls */}
      <View style={styles.controlsRow}>
        <View style={styles.controlPill}>
          <Pressable style={styles.controlBtn}>
            <Icon name="clock" size={14} color={COLORS.textSecondary} />
          </Pressable>
          <Pressable style={styles.controlBtn}>
            <Icon name="arrows-clockwise" size={14} color={COLORS.textSecondary} />
          </Pressable>
          <Pressable style={styles.controlBtn}>
            <Icon name="shuffle" size={14} color={COLORS.textSecondary} />
          </Pressable>
        </View>

        <View style={[styles.controlPill, styles.playbackPill]}>
          <Pressable style={styles.controlBtn}>
            <Icon name="caret-left" size={16} color={COLORS.textSecondary} />
          </Pressable>
          <Pressable onPress={handlePlayPause} style={[styles.controlBtn, styles.playBtn]}>
            <Icon name={isPlaying ? 'pause' : 'play'} size={16} color={COLORS.textPrimary} />
          </Pressable>
          <Pressable style={styles.controlBtn}>
            <Icon name="caret-right" size={16} color={COLORS.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.controlPill}>
          <Pressable style={styles.controlBtn}>
            <Icon name="target" size={14} color={COLORS.textSecondary} />
          </Pressable>
          <Pressable style={styles.controlBtn}>
            <Icon name="speaker-high" size={14} color={COLORS.textSecondary} />
          </Pressable>
        </View>
      </View>

      {/* Bottom Stark Numerals (Optional Left/Right split) */}
      {(leftStat || rightStat) && (
        <View style={styles.bottomStatsRow}>
          {leftStat && (
            <View style={styles.statColumn}>
              <Text variant="caption" color={COLORS.textTertiary} style={styles.statLabel}>
                {leftStat.label}
              </Text>
              <Text variant="displayLg" color={COLORS.textPrimary} style={styles.statNumber}>
                {leftStat.value}
              </Text>
            </View>
          )}
          {rightStat && (
            <View style={[styles.statColumn, styles.statColumnRight]}>
              <Text variant="caption" color={COLORS.textTertiary} style={styles.statLabel}>
                {rightStat.label}
              </Text>
              <Text variant="displayLg" color={COLORS.textPrimary} style={styles.statNumber}>
                {rightStat.value}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bgPanel,
    borderRadius: RADIUS.radiusScreen,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.hairline,
  },
  statusRow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  statusText: {
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.2,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  timerBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  timerLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  timerValue: {
    fontSize: 32,
    lineHeight: 36,
    fontFamily: 'JetBrainsMono-Bold',
    letterSpacing: -0.5,
  },
  actionRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.accentRed,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 51, 75, 0.15)',
  },
  actionInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.hairline,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    gap: 6,
  },
  controlPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.hairline,
  },
  playbackPill: {
    paddingHorizontal: 12,
    gap: 14,
  },
  controlBtn: {
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: RADIUS.pill,
    padding: 4,
  },
  bottomStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.hairline,
  },
  statColumn: {
    flex: 1,
  },
  statColumnRight: {
    alignItems: 'flex-end',
  },
  statLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
    marginBottom: 4,
    fontFamily: 'Inter-Medium',
  },
  statNumber: {
    fontSize: 48,
    lineHeight: 52,
    fontFamily: 'SpaceGrotesk-Bold',
  },
});

export default HudPanel;
