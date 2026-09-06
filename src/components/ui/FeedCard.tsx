import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, Pressable, Alert } from 'react-native';
import { Text } from './Text';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { Input } from './Input';
import { BottomSheet } from './BottomSheet';
import { COLORS, SPACE, RADIUS } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MockFeedItem } from '@/hooks/useMockFeed';
import { ReactionPicker } from '../social/ReactionPicker';
import { CommentSection } from '../social/CommentSection';
import { WhoReactedSheet } from '../social/WhoReactedSheet';
import { formatDistanceToNow } from 'date-fns';

import { toggleSubmissionReaction } from '@/services/reactionService';
import {
  addSubmissionComment,
  fetchSubmissionComments,
  subscribeToSubmissionComments,
  deleteSubmissionComment,
  SubmissionComment,
} from '@/services/commentService';
import { useAuthStore } from '@/store/useAuthStore';
import { useUpdateSubmission, useDeleteSubmission } from '@/hooks/useSubmissions';

type Props = {
  item: MockFeedItem;
};

export function FeedCard({ item }: Props) {
  const { user } = useAuthStore();
  const updateSubmissionMut = useUpdateSubmission();
  const deleteSubmissionMut = useDeleteSubmission();

  const [showComments, setShowComments] = useState(false);
  const [showWhoReacted, setShowWhoReacted] = useState(false);
  const [showActionsSheet, setShowActionsSheet] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState(item.title || '');
  const [editDescription, setEditDescription] = useState(item.description || '');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [localComments, setLocalComments] = useState<{
    id: string;
    userId: string;
    username: string;
    avatarUrl: string | null;
    text: string;
    createdAt: string;
  }[]>([]);

  const isAuthor = Boolean(user?.id && item.userId === user.id);

  // Calculate submission age
  const submissionTimestamp = new Date(item.clientTimestamp).getTime();
  const ageMs = Date.now() - (isNaN(submissionTimestamp) ? Date.now() : submissionTimestamp);
  const canEdit = isAuthor && ageMs <= 60 * 60 * 1000; // 1-hour window
  const canDelete = isAuthor && ageMs <= 24 * 60 * 60 * 1000; // 24-hour window

  // Subscribe to real comments
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    fetchSubmissionComments(item.id)
      .then((comments) => {
        if (comments && comments.length > 0) {
          setLocalComments(comments);
        }
      })
      .catch((err) => console.warn('[FeedCard] Error fetching comments:', err));

    try {
      unsubscribe = subscribeToSubmissionComments(item.id, (comments: SubmissionComment[]) => {
        setLocalComments(comments);
      });
    } catch {}

    return () => {
      unsubscribe?.();
    };
  }, [item.id]);

  const handleAddComment = async (text: string) => {
    const optimisticComment = {
      id: `opt_${Date.now()}`,
      userId: user?.id || 'me',
      username: user?.username || 'me',
      avatarUrl: user?.avatarUrl ?? null,
      text,
      createdAt: new Date().toISOString(),
    };
    setLocalComments((prev) => [...prev, optimisticComment]);

    try {
      await addSubmissionComment(item.id, text);
    } catch (err) {
      console.warn('[FeedCard] Error saving comment:', err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteSubmissionComment(item.id, commentId);
      setLocalComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      console.warn('[FeedCard] Error deleting comment:', err);
    }
  };

  const handleReact = async (emoji: string) => {
    try {
      await toggleSubmissionReaction(item.id, emoji);
    } catch (err) {
      console.warn('[FeedCard] Error toggling reaction:', err);
    }
  };

  const handleSaveEdit = async () => {
    setIsSavingEdit(true);
    try {
      await updateSubmissionMut.mutateAsync({
        submissionId: item.id,
        input: {
          title: editTitle.trim() || null,
          description: editDescription.trim() || null,
        },
      });
      setShowEditSheet(false);
      Alert.alert('Updated', 'Your proof notes have been updated.');
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Could not update submission');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteSubmission = () => {
    setShowActionsSheet(false);
    Alert.alert(
      'Break Streak Warning ⚠️',
      'Deleting this submission may break your active habit streak for today. Are you sure you want to delete this proof?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Proof',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSubmissionMut.mutateAsync(item.id);
              Alert.alert('Deleted', 'Your proof has been removed.');
            } catch (err: any) {
              Alert.alert('Delete Failed', err.message || 'Could not delete proof');
            }
          },
        },
      ]
    );
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

  const userReaction = item.initialReactions?.find((r) => r.userId === user?.id)?.emoji;

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

        <View style={styles.headerRight}>
          <View style={[styles.groupPill, { backgroundColor: `${item.groupColor}20` }]}>
            <Text variant="caption" style={[styles.groupPillText, { color: item.groupColor }]}>
              {item.groupName}
            </Text>
          </View>

          {isAuthor && (
            <Pressable
              onPress={() => setShowActionsSheet(true)}
              hitSlop={8}
              style={styles.moreBtn}
            >
              <MaterialCommunityIcons name="dots-horizontal" size={20} color={COLORS.textSecondary} />
            </Pressable>
          )}
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
          <ReactionPicker
            initialCounts={reactionCounts}
            userReaction={userReaction}
            onReact={handleReact}
            onShowReactions={() => setShowWhoReacted(true)}
          />

          <Pressable
            style={styles.commentAction}
            onPress={() => setShowComments(!showComments)}
          >
            <MaterialCommunityIcons name="comment-outline" size={20} color={COLORS.textSecondary} />
            {(item.commentCount > 0 || localComments.length > 0) && (
              <Text variant="caption" color={COLORS.textSecondary} style={styles.commentCount}>
                {Math.max(item.commentCount, localComments.length)}
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
            onDeleteComment={handleDeleteComment}
            currentUserId={user?.id}
            currentUser={{ avatarUrl: user?.avatarUrl ?? null }}
          />
        </View>
      )}

      {/* Who Reacted Bottom Sheet */}
      <WhoReactedSheet
        isVisible={showWhoReacted}
        onClose={() => setShowWhoReacted(false)}
        submissionId={item.id}
      />

      {/* Author Actions Sheet */}
      <BottomSheet
        isVisible={showActionsSheet}
        onClose={() => setShowActionsSheet(false)}
      >
        <View style={styles.actionsSheetContent}>
          <Text variant="headingSm" color={COLORS.textPrimary} style={{ marginBottom: SPACE.md }}>
            Manage Proof
          </Text>

          {canEdit && (
            <Pressable
              style={styles.actionOption}
              onPress={() => {
                setShowActionsSheet(false);
                setShowEditSheet(true);
              }}
            >
              <MaterialCommunityIcons name="pencil-outline" size={20} color={COLORS.accentBlue} />
              <View style={{ marginLeft: SPACE.md }}>
                <Text variant="label" color={COLORS.textPrimary}>Edit Notes</Text>
                <Text variant="caption" color={COLORS.textTertiary}>Available for 1h after posting</Text>
              </View>
            </Pressable>
          )}

          {canDelete && (
            <Pressable
              style={styles.actionOption}
              onPress={handleDeleteSubmission}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={20} color={COLORS.danger} />
              <View style={{ marginLeft: SPACE.md }}>
                <Text variant="label" color={COLORS.danger}>Delete Proof</Text>
                <Text variant="caption" color={COLORS.textTertiary}>Streak will be affected if today</Text>
              </View>
            </Pressable>
          )}

          <Button
            label="Cancel"
            variant="secondary"
            onPress={() => setShowActionsSheet(false)}
            style={{ marginTop: SPACE.md }}
          />
        </View>
      </BottomSheet>

      {/* Edit Submission Bottom Sheet */}
      <BottomSheet
        isVisible={showEditSheet}
        onClose={() => setShowEditSheet(false)}
      >
        <View style={styles.actionsSheetContent}>
          <Text variant="headingSm" color={COLORS.textPrimary} style={{ marginBottom: SPACE.md }}>
            Edit Proof Notes
          </Text>
          <Input
            label="Title"
            value={editTitle}
            onChangeText={setEditTitle}
            maxLength={80}
            style={{ marginBottom: SPACE.md }}
          />
          <Input
            label="Description"
            value={editDescription}
            onChangeText={setEditDescription}
            maxLength={500}
            multiline
            style={{ minHeight: 80, marginBottom: SPACE.lg }}
          />
          <Button
            label={isSavingEdit ? 'Saving...' : 'Save Changes'}
            onPress={handleSaveEdit}
            disabled={isSavingEdit}
          />
        </View>
      </BottomSheet>
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
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
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
  moreBtn: {
    padding: 4,
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
  },
  actionsSheetContent: {
    paddingBottom: SPACE.lg,
  },
  actionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACE.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.hairline,
  },
});
