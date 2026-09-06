import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Share, Pressable, ActivityIndicator } from 'react-native';
import { Card } from '../ui/Card';
import { Text } from '../ui/Text';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { COLORS, SPACE, RADIUS, SHADOWS } from '@/constants/theme';
import { fetchGroupWeeklyWrapup, WeeklyWrapupData } from '@/services/weeklyWrapService';
import * as Haptics from 'expo-haptics';

interface Props {
  groupId: string;
}

export function WeeklyWrapCard({ groupId }: Props) {
  const [data, setData] = useState<WeeklyWrapupData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroupWeeklyWrapup(groupId)
      .then((res) => setData(res))
      .catch((err) => console.warn('[WeeklyWrapCard] Error fetching weekly wrap:', err))
      .finally(() => setLoading(false));
  }, [groupId]);

  const handleShare = async () => {
    if (!data) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const mvpText = data.mvp ? `👑 Squad MVP: @${data.mvp.username} (${data.mvp.submissionCount} proofs)` : '';
      const shareMessage = 
        `🏆 ${data.groupName} — Weekly Squad Wrap-Up!\n` +
        `📊 Consistency Score: ${data.consistencyRate}%\n` +
        `⚡ Total Proofs Logged: ${data.totalSubmissions}\n` +
        `🔥 Longest Streak: ${data.topStreak} days\n` +
        `${mvpText}\n\n` +
        `Join the pact on StreakPact! streakpact://group/${data.groupId}`;

      await Share.share({
        message: shareMessage,
      });
    } catch (err) {
      console.warn('[WeeklyWrapCard] Share error:', err);
    }
  };

  if (loading) {
    return (
      <Card variant="outline" padding="md" style={styles.card}>
        <ActivityIndicator color={COLORS.accentBlue} size="small" />
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card variant="elevated" padding="lg" style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.groupEmoji}>{data.groupEmoji || '🏆'}</Text>
          <View style={{ marginLeft: SPACE.sm }}>
            <Text variant="headingSm" color={COLORS.textPrimary}>
              Weekly Wrap-Up
            </Text>
            <Text variant="caption" color={COLORS.textTertiary}>
              Past 7 days performance
            </Text>
          </View>
        </View>
        <Badge label="Sunday Wrap" variant="pill" size="sm" />
      </View>

      {/* Consistency Metric Banner */}
      <View style={styles.metricBanner}>
        <View style={styles.metricCircle}>
          <Text variant="numericLg" color={COLORS.accentBlue} style={styles.consistencyVal}>
            {data.consistencyRate}%
          </Text>
          <Text variant="caption" color={COLORS.textSecondary} style={{ fontSize: 10 }}>
            Consistency
          </Text>
        </View>

        <View style={styles.statsSummaryColumn}>
          <View style={styles.statLine}>
            <Icon name="check-circle" size={16} color={COLORS.positive} />
            <Text variant="bodySm" color={COLORS.textPrimary} style={{ marginLeft: 6 }}>
              <Text style={{ fontWeight: '700' }}>{data.totalSubmissions}</Text> Total Proofs
            </Text>
          </View>

          <View style={styles.statLine}>
            <Icon name="fire" size={16} color={COLORS.accentRed} />
            <Text variant="bodySm" color={COLORS.textPrimary} style={{ marginLeft: 6 }}>
              <Text style={{ fontWeight: '700' }}>{data.topStreak}d</Text> Top Streak
            </Text>
          </View>
        </View>
      </View>

      {/* MVP Section */}
      {data.mvp && (
        <View style={styles.mvpSection}>
          <View style={styles.mvpBadge}>
            <Icon name="crown" size={14} color="#FBBF24" bold />
            <Text variant="caption" color="#FBBF24" style={{ fontWeight: '700', marginLeft: 4 }}>
              SQUAD MVP
            </Text>
          </View>

          <View style={styles.mvpContentRow}>
            <Avatar url={data.mvp.avatarUrl} name={data.mvp.displayName} size={36} />
            <View style={{ marginLeft: SPACE.sm, flex: 1 }}>
              <Text variant="body" color={COLORS.textPrimary} style={{ fontWeight: '600' }}>
                {data.mvp.displayName}
              </Text>
              <Text variant="caption" color={COLORS.textSecondary}>
                @{data.mvp.username}
              </Text>
            </View>
            <View style={styles.mvpProofsCount}>
              <Text variant="headingSm" color={COLORS.textPrimary}>
                {data.mvp.submissionCount}
              </Text>
              <Text variant="caption" color={COLORS.textTertiary} style={{ fontSize: 10 }}>
                proofs
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Share CTA */}
      <View style={{ marginTop: SPACE.md }}>
        <Button
          label="Share Wrap-Up 🚀"
          variant="secondary"
          size="md"
          leadingIcon="share-network"
          onPress={handleShare}
          fullWidth
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACE.lg,
    borderRadius: RADIUS.lg,
    borderColor: COLORS.hairline,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACE.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupEmoji: {
    fontSize: 28,
  },
  metricBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.md,
    padding: SPACE.md,
    marginBottom: SPACE.md,
    borderWidth: 1,
    borderColor: COLORS.hairline,
  },
  metricCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: SPACE.md,
    borderRightWidth: 1,
    borderRightColor: COLORS.hairline,
    minWidth: 80,
  },
  consistencyVal: {
    fontWeight: '800',
  },
  statsSummaryColumn: {
    marginLeft: SPACE.md,
    gap: 8,
  },
  statLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mvpSection: {
    backgroundColor: 'rgba(251, 191, 36, 0.06)',
    borderRadius: RADIUS.md,
    padding: SPACE.md,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  mvpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACE.xs,
  },
  mvpContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mvpProofsCount: {
    alignItems: 'flex-end',
  },
});
