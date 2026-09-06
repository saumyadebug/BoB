import React, { useState } from 'react';
import { View, StyleSheet, Image, Pressable } from 'react-native';
import { Text } from './Text';
import { Avatar } from './Avatar';
import { COLORS, SPACE, RADIUS } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MockFeedItem } from '@/hooks/useMockFeed';
import { ReactionPicker } from '../social/ReactionPicker';
import { CommentSection } from '../social/CommentSection';
import { formatDistanceToNow } from 'date-fns';

type Props = {
  item: MockFeedItem;
};

export function FeedCard({ item }: Props) {
  const [showComments, setShowComments] = useState(false);
  const [localComments, setLocalComments] = useState<{
    id: string;
    userId: string;
    username: string;
    avatarUrl: string | null;
    text: string;
    createdAt: string;
  }[]>([
    {
      id: 'c1',
      userId: 'u1',
      username: 'mj24',
      avatarUrl: 'https://i.pravatar.cc/150?u=user1',
      text: 'Looks awesome!',
      createdAt: new Date().toISOString(),
    }
  ]);

  const handleAddComment = (text: string) => {
    setLocalComments(prev => [...prev, {
      id: Math.random().toString(),
      userId: 'me',
      username: 'me',
      avatarUrl: null,
      text,
      createdAt: new Date().toISOString(),
    }]);
  };
  
  // Format relative time (e.g. "2 hours ago")
  let timeAgo = '';
  try {
    timeAgo = formatDistanceToNow(new Date(item.clientTimestamp), { addSuffix: true });
  } catch (e) {
    timeAgo = 'recently';
  }

  // Count initial reactions by emoji
  const reactionCounts = item.initialReactions.reduce((acc, rx) => {
    acc[rx.emoji] = (acc[rx.emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Avatar url={item.user?.avatarUrl ?? null} size={40} name={item.user?.username ?? 'User'} />
          <View>
            <Text variant="body" color={COLORS.textPrimary} style={styles.displayName}>
              {item.user?.displayName}
            </Text>
            <Text variant="caption" color={COLORS.textTertiary}>
              @{item.user?.username} • {timeAgo}
            </Text>
          </View>
        </View>
        <View style={[styles.groupPill, { backgroundColor: `${item.groupColor}20` }]}>
          <Text variant="caption" style={[styles.groupPillText, { color: item.groupColor }]}>
            {item.groupName}
          </Text>
        </View>
      </View>

      {/* Activity Context */}
      <View style={styles.activityContext}>
        <Text variant="headingMd" color={COLORS.textPrimary}>
          {item.title || 'Completed Activity'}
        </Text>
      </View>

      {/* Media */}
      {item.photoUrl && (
        <Image 
          source={{ uri: item.photoUrl }} 
          style={styles.media}
          resizeMode="cover"
        />
      )}

      {/* Content */}
      <View style={styles.content}>
        {item.description && (
          <Text variant="body" color={COLORS.textSecondary} style={styles.description}>
            {item.description}
          </Text>
        )}
      </View>

      {/* Footer / Social Actions */}
      <View style={styles.footer}>
        <View style={styles.actionRow}>
          <ReactionPicker initialCounts={reactionCounts} />
          
          <Pressable 
            style={styles.commentAction} 
            onPress={() => setShowComments(!showComments)}
          >
            <MaterialCommunityIcons name="comment-outline" size={20} color={COLORS.textSecondary} />
            {item.commentCount > 0 && (
              <Text variant="caption" color={COLORS.textSecondary} style={styles.commentCount}>
                {item.commentCount}
              </Text>
            )}
          </Pressable>
        </View>

        <View style={styles.streakBadge}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text variant="caption" style={styles.streakText}>
            Day {item.streakCount}
          </Text>
        </View>
      </View>

      {/* Comments Expansion */}
      {showComments && (
        <View style={styles.commentsWrapper}>
          <CommentSection 
            comments={localComments}
            onAddComment={handleAddComment}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgPanel,
    marginBottom: SPACE.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACE.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  displayName: {
    fontWeight: '600',
  },
  groupPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  groupPillText: {
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  activityContext: {
    paddingHorizontal: SPACE.md,
    paddingBottom: SPACE.sm,
  },
  media: {
    width: '100%',
    height: 280,
    backgroundColor: COLORS.bgSurface,
  },
  content: {
    paddingHorizontal: SPACE.md,
    paddingTop: SPACE.sm,
  },
  description: {
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACE.md,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  commentCount: {
    fontWeight: '600',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 149, 0, 0.1)', // Orange tint
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    gap: 4,
  },
  streakEmoji: {
    fontSize: 14,
  },
  streakText: {
    color: '#FF9500',
    fontWeight: '700',
  },
  commentsWrapper: {
    paddingHorizontal: SPACE.md,
    paddingBottom: SPACE.md,
  }
});
