import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Pressable, Platform } from 'react-native';
import { Text } from '../ui/Text';
import { Avatar } from '../ui/Avatar';
import { COLORS, SPACE, RADIUS } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';

type CommentData = {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
  text: string;
  createdAt: string;
};

type Props = {
  comments: CommentData[];
  onAddComment?: (text: string) => void;
  onDeleteComment?: (commentId: string) => void;
  currentUser?: { avatarUrl: string | null };
  currentUserId?: string;
};

export function CommentSection({ comments, onAddComment, onDeleteComment, currentUser, currentUserId }: Props) {
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (inputText.trim() && onAddComment) {
      onAddComment(inputText.trim());
      setInputText('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.commentsList}>
        {comments.map(comment => {
          let timeAgo = '';
          try {
            timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });
          } catch {
            timeAgo = 'recently';
          }

          const isAuthor = currentUserId && comment.userId === currentUserId;

          return (
            <View key={comment.id} style={styles.commentRow}>
              <Avatar url={comment.avatarUrl} size={24} name={comment.username} />
              <View style={styles.commentBubble}>
                <View style={styles.commentMetaRow}>
                  <Text variant="caption" color={COLORS.textSecondary} style={styles.username}>
                    @{comment.username}
                  </Text>
                  <Text variant="caption" color={COLORS.textTertiary} style={styles.timeAgo}>
                    • {timeAgo}
                  </Text>
                  {isAuthor && onDeleteComment && (
                    <Pressable
                      onPress={() => onDeleteComment(comment.id)}
                      hitSlop={8}
                      style={styles.deleteBtn}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={14} color={COLORS.textTertiary} />
                    </Pressable>
                  )}
                </View>
                <Text variant="body" color={COLORS.textPrimary} style={styles.commentText}>
                  {comment.text}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.inputRow}>
        <Avatar url={currentUser?.avatarUrl ?? null} size={32} name="Me" />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Add a comment..."
            placeholderTextColor={COLORS.textTertiary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={200}
            onKeyPress={(e: any) => {
              if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Pressable 
            style={({ pressed }) => [
              styles.sendButton,
              (!inputText.trim()) && styles.sendButtonDisabled,
              pressed && styles.pressed
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <MaterialCommunityIcons 
              name="send" 
              size={18} 
              color={inputText.trim() ? COLORS.accentBlue : COLORS.textTertiary} 
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: SPACE.md,
    gap: SPACE.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.hairline,
  },
  commentsList: {
    gap: SPACE.sm,
  },
  commentRow: {
    flexDirection: 'row',
    gap: SPACE.xs,
    alignItems: 'flex-start',
  },
  commentBubble: {
    backgroundColor: COLORS.bgPanel,
    padding: SPACE.sm,
    borderRadius: RADIUS.lg,
    borderTopLeftRadius: 4,
    flex: 1,
  },
  commentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  timeAgo: {
    fontSize: 10,
  },
  deleteBtn: {
    marginLeft: 'auto',
    padding: 2,
  },
  username: {
    fontWeight: '600',
  },
  commentText: {
    fontSize: 14,
  },
  inputRow: {
    flexDirection: 'row',
    gap: SPACE.sm,
    alignItems: 'flex-end',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgPanel,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    paddingLeft: SPACE.md,
    paddingRight: SPACE.xs,
    minHeight: 40,
  },
  input: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    color: COLORS.textPrimary,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.7,
  }
});
