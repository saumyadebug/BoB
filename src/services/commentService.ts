import { firestore, COLLECTIONS } from './firebase';
import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { useAuthStore } from '@/store/useAuthStore';
import { AppError } from './errors';

const LOG_PREFIX = '[commentService]';

export interface SubmissionComment {
  id: string;
  submissionId: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  text: string;
  createdAt: string;
}

/**
 * Add a new comment to a submission thread in Firestore.
 */
export async function addSubmissionComment(
  submissionId: string,
  text: string
): Promise<SubmissionComment> {
  const user = useAuthStore.getState().user;
  if (!user?.id) {
    throw new AppError('NOT_AUTHENTICATED', 'You must be logged in to comment');
  }

  const trimmed = text.trim();
  if (!trimmed) {
    throw new AppError('VALIDATION', 'Comment cannot be empty');
  }

  const commentData = {
    submissionId,
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl ?? null,
    text: trimmed,
    createdAt: new Date().toISOString(),
  };

  if (!firestore) {
    console.warn(`${LOG_PREFIX} Firestore not configured, local comment returned`);
    return { id: `local_${Date.now()}`, ...commentData };
  }

  try {
    const colRef = collection(firestore, COLLECTIONS.comments(submissionId));
    const docRef = await addDoc(colRef, commentData);
    return { id: docRef.id, ...commentData };
  } catch (err: any) {
    console.error(`${LOG_PREFIX} Failed to add comment:`, err);
    throw new AppError('NETWORK', 'Failed to post comment');
  }
}

/**
 * Fetch comments for a specific submission.
 */
export async function fetchSubmissionComments(
  submissionId: string,
  limitCount: number = 50
): Promise<SubmissionComment[]> {
  if (!firestore) return [];

  try {
    const colRef = collection(firestore, COLLECTIONS.comments(submissionId));
    const q = query(colRef, orderBy('createdAt', 'asc'), limit(limitCount));
    const snap = await getDocs(q);

    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        submissionId,
        userId: data.userId,
        username: data.username || 'member',
        displayName: data.displayName || 'Member',
        avatarUrl: data.avatarUrl ?? null,
        text: data.text,
        createdAt: data.createdAt || new Date().toISOString(),
      };
    });
  } catch (err) {
    console.warn(`${LOG_PREFIX} Failed to fetch comments:`, err);
    return [];
  }
}

/**
 * Delete a comment from a submission thread (author or admin only).
 */
export async function deleteSubmissionComment(
  submissionId: string,
  commentId: string
): Promise<void> {
  const user = useAuthStore.getState().user;
  if (!user?.id) {
    throw new AppError('NOT_AUTHENTICATED', 'You must be logged in to delete comments');
  }

  if (!firestore) return;

  try {
    const docRef = doc(firestore, `${COLLECTIONS.comments(submissionId)}/${commentId}`);
    await deleteDoc(docRef);
  } catch (err: any) {
    console.error(`${LOG_PREFIX} Failed to delete comment:`, err);
    throw new AppError('NETWORK', 'Failed to delete comment');
  }
}

/**
 * Subscribe to real-time comment updates for a submission.
 */
export function subscribeToSubmissionComments(
  submissionId: string,
  callback: (comments: SubmissionComment[]) => void
): () => void {
  if (!firestore) {
    return () => {};
  }

  try {
    const colRef = collection(firestore, COLLECTIONS.comments(submissionId));
    const q = query(colRef, orderBy('createdAt', 'asc'), limit(50));

    return onSnapshot(
      q,
      (snap) => {
        const comments: SubmissionComment[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            submissionId,
            userId: data.userId,
            username: data.username || 'member',
            displayName: data.displayName || 'Member',
            avatarUrl: data.avatarUrl ?? null,
            text: data.text,
            createdAt: data.createdAt || new Date().toISOString(),
          };
        });
        callback(comments);
      },
      (err) => {
        console.warn(`${LOG_PREFIX} Comment subscription error:`, err);
      }
    );
  } catch (err) {
    console.warn(`${LOG_PREFIX} Error creating comment subscription:`, err);
    return () => {};
  }
}

