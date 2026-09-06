import { firestore, COLLECTIONS } from './firebase';
import { collection, addDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { useAuthStore } from '@/store/useAuthStore';
import { AppError } from './errors';
import { supabase } from './supabase';

const LOG_PREFIX = '[nudgeService]';
const NUDGE_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours

/**
 * Send a streak nudge to a teammate.
 * Enforces:
 *   - Current user is logged in
 *   - 4-hour cooldown per recipient
 */
export async function sendNudge(
  recipientId: string,
  groupId: string,
  activityId?: string
): Promise<{ success: boolean; message: string }> {
  const user = useAuthStore.getState().user;
  if (!user?.id) {
    throw new AppError('NOT_AUTHENTICATED', 'You must be logged in to send a nudge');
  }

  if (user.id === recipientId) {
    throw new AppError('NOT_ALLOWED', 'You cannot nudge yourself');
  }

  const now = Date.now();
  const cutoffTime = new Date(now - NUDGE_COOLDOWN_MS).toISOString();

  // 1. Check cooldown in Firestore
  if (firestore) {
    try {
      const q = query(
        collection(firestore, COLLECTIONS.nudges(recipientId)),
        where('senderId', '==', user.id),
        where('sentAt', '>=', cutoffTime),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        throw new AppError(
          'NOT_ALLOWED',
          'You can only nudge a teammate once every 4 hours.'
        );
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      console.warn(`${LOG_PREFIX} Could not verify Firestore cooldown, proceeding`, err);
    }
  }

  const nudgeRecord = {
    senderId: user.id,
    recipientId,
    groupId,
    activityId: activityId || null,
    sentAt: new Date().toISOString(),
    wasConverted: false,
    senderName: user.displayName,
    senderAvatar: user.avatarUrl,
  };

  // 2. Write to Firestore nudge queue
  if (firestore) {
    try {
      await addDoc(
        collection(firestore, COLLECTIONS.nudges(recipientId)),
        nudgeRecord
      );
    } catch (err) {
      console.warn(`${LOG_PREFIX} Failed to write nudge to Firestore:`, err);
    }
  }

  // 3. Mirror notification into notifications table if available
  try {
    await supabase.from('notifications').insert({
      user_id: recipientId,
      type: 'nudge_received',
      title: `${user.displayName} nudged you! ⚡`,
      body: "Keep the momentum going — log your proof for today.",
      deep_link: `streakpact://group/${groupId}`,
      is_read: false,
      created_at: new Date().toISOString(),
    });
  } catch (notifErr) {
    console.warn(`${LOG_PREFIX} Failed to mirror in-app notification:`, notifErr);
  }

  return { success: true, message: `Nudged teammate!` };
}
