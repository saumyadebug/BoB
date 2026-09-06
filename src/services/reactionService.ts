import { firestore, COLLECTIONS } from './firebase';
import { doc, setDoc, deleteDoc, getDoc, getDocs, collection } from 'firebase/firestore';
import { useAuthStore } from '@/store/useAuthStore';
import { AppError } from './errors';
import { Reaction, User } from '@/types';

const LOG_PREFIX = '[reactionService]';

export interface ReactionDetail {
  userId: string;
  emoji: string;
  displayName: string;
  avatarUrl?: string | null;
  createdAt: string;
}

export type ReactionItem = ReactionDetail;

/**
 * Toggles an emoji reaction for the current user on a submission.
 * Rules:
 *   - 1 reaction per user per submission.
 *   - Tapping same emoji toggles it off.
 *   - Tapping different emoji updates to new emoji.
 */
export async function toggleSubmissionReaction(
  submissionId: string,
  emoji: string
): Promise<{ action: 'added' | 'removed' | 'changed'; emoji: string }> {
  const user = useAuthStore.getState().user;
  if (!user?.id) {
    throw new AppError('NOT_AUTHENTICATED', 'You must be logged in to react');
  }

  if (!firestore) {
    console.warn(`${LOG_PREFIX} Firestore not configured, local reaction only`);
    return { action: 'added', emoji };
  }

  try {
    const docPath = `${COLLECTIONS.reactions(submissionId)}/${user.id}`;
    const reactionRef = doc(firestore, docPath);
    const existingSnap = await getDoc(reactionRef);

    if (existingSnap.exists()) {
      const existingData = existingSnap.data();
      if (existingData.emoji === emoji) {
        // Same emoji -> remove
        await deleteDoc(reactionRef);
        return { action: 'removed', emoji };
      } else {
        // Different emoji -> update
        await setDoc(reactionRef, {
          userId: user.id,
          emoji,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          updatedAt: new Date().toISOString(),
        });
        return { action: 'changed', emoji };
      }
    } else {
      // New reaction -> add
      await setDoc(reactionRef, {
        userId: user.id,
        emoji,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        createdAt: new Date().toISOString(),
      });
      return { action: 'added', emoji };
    }
  } catch (err: any) {
    console.warn(`${LOG_PREFIX} Error toggling reaction:`, err);
    throw new AppError('NETWORK', 'Failed to toggle reaction');
  }
}

/**
 * Fetch list of all user reactions for a submission (used by the Who Reacted bottom sheet).
 */
export async function fetchSubmissionReactions(submissionId: string): Promise<ReactionDetail[]> {
  if (!firestore) return [];

  try {
    const colRef = collection(firestore, COLLECTIONS.reactions(submissionId));
    const snap = await getDocs(colRef);

    return snap.docs.map((d) => {
      const data = d.data();
      return {
        userId: d.id,
        emoji: data.emoji,
        displayName: data.displayName || 'Member',
        avatarUrl: data.avatarUrl ?? null,
        createdAt: data.createdAt || new Date().toISOString(),
      };
    });
  } catch (err) {
    console.warn(`${LOG_PREFIX} Failed to fetch reactions:`, err);
    return [];
  }
}
