import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { BottomSheet } from '../ui/BottomSheet';
import { Text } from '../ui/Text';
import { Avatar } from '../ui/Avatar';
import { Icon } from '../ui/Icon';
import { COLORS, SPACE, RADIUS } from '@/constants/theme';
import { fetchSubmissionReactions, ReactionItem } from '@/services/reactionService';

interface Props {
  isVisible: boolean;
  onClose: () => void;
  submissionId: string;
}

export function WhoReactedSheet({ isVisible, onClose, submissionId }: Props) {
  const [loading, setLoading] = useState(false);
  const [reactions, setReactions] = useState<ReactionItem[]>([]);

  useEffect(() => {
    if (isVisible && submissionId) {
      setLoading(true);
      fetchSubmissionReactions(submissionId)
        .then((data) => setReactions(data))
        .catch((err) => console.warn('[WhoReactedSheet] Error fetching reactions:', err))
        .finally(() => setLoading(false));
    }
  }, [isVisible, submissionId]);

  return (
    <BottomSheet isVisible={isVisible} onClose={onClose}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text variant="headingMd" color={COLORS.textPrimary}>
            Reactions ({reactions.length})
          </Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Icon name="x" size={20} color={COLORS.textTertiary} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={COLORS.accentBlue} size="small" />
          </View>
        ) : reactions.length === 0 ? (
          <View style={styles.centerBox}>
            <Text variant="bodySm" color={COLORS.textSecondary}>
              No reactions yet. Be the first to cheer them on!
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {reactions.map((rx) => (
              <View key={`${rx.userId}_${rx.emoji}`} style={styles.memberRow}>
                <View style={styles.memberLeft}>
                  <Avatar url={rx.avatarUrl ?? null} name={rx.displayName || 'Member'} size={36} />
                  <View style={{ marginLeft: SPACE.sm }}>
                    <Text variant="body" color={COLORS.textPrimary} style={{ fontWeight: '600' }}>
                      {rx.displayName || 'Squad Member'}
                    </Text>
                    <Text variant="caption" color={COLORS.textTertiary}>
                      Pact member
                    </Text>
                  </View>
                </View>
                <View style={styles.emojiBadge}>
                  <Text style={styles.emojiText}>{rx.emoji}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: SPACE.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACE.md,
    paddingBottom: SPACE.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.hairline,
  },
  centerBox: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    maxHeight: 320,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACE.sm,
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emojiBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.hairline,
  },
  emojiText: {
    fontSize: 18,
  },
});
