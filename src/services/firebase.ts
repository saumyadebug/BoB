import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  limit,
  QueryConstraint,
} from 'firebase/firestore';
import { Platform } from 'react-native';
import ENV from './env';

/**
 * Firebase client — Real-time feed, push notifications.
 *
 * NOTE: Firebase Auth was dropped in Phase 1.5. Supabase Auth is now the
 * single source of truth. We only keep Firestore (real-time feed) and the
 * FCM config (push notifications, Phase 9).
 *
 * If `EXPO_PUBLIC_FIREBASE_API_KEY` is empty, we skip initialization entirely
 * so the app can boot during early development before Firebase is wired up.
 */

let app: ReturnType<typeof getApp> | null = null;
let firestoreInstance: ReturnType<typeof getFirestore> | null = null;

const isFirebaseConfigured = Boolean(ENV.FIREBASE_API_KEY && ENV.FIREBASE_PROJECT_ID);

if (isFirebaseConfigured) {
  const firebaseConfig = {
    apiKey: ENV.FIREBASE_API_KEY,
    authDomain: ENV.FIREBASE_AUTH_DOMAIN,
    projectId: ENV.FIREBASE_PROJECT_ID,
    storageBucket: ENV.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: ENV.FIREBASE_MESSAGING_SENDER_ID,
    appId: ENV.FIREBASE_APP_ID,
    measurementId: ENV.FIREBASE_MEASUREMENT_ID,
  };

  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  firestoreInstance = getFirestore(app);
}

export const firebaseApp = app;
export const firestore = firestoreInstance;

// ─── Firestore Collection Paths ────────────────────────────────────────────────

/**
 * Firestore collection structure:
 *
 * /feed/{groupId}/submissions/{submissionId}  — Real-time group feed
 * /reactions/{submissionId}/users/{userId}    — Per-submission reactions
 * /comments/{submissionId}/list/{commentId}   — Per-submission comments
 * /nudges/{recipientId}/queue/{nudgeId}       — Nudge queue per user
 * /notifications/{userId}/list/{notifId}      — In-app notifications per user
 */
export const COLLECTIONS = {
  feed: (groupId: string) => `feed/${groupId}/submissions`,
  reactions: (submissionId: string) => `reactions/${submissionId}/users`,
  comments: (submissionId: string) => `comments/${submissionId}/list`,
  nudges: (recipientId: string) => `nudges/${recipientId}/queue`,
  notifications: (userId: string) => `notifications/${userId}/list`,
} as const;

// ─── Firestore Listener Helpers ──────────────────────────────────────────────

/**
 * Subscribe to real-time feed updates for a group.
 * Returns an unsubscribe function.
 */
export function subscribeToGroupFeed(
  groupId: string,
  pageSize: number = 20,
  callback: (docs: any[]) => void
): () => void {
  if (!firestoreInstance) {
    console.warn('[firebase] Firestore not configured — feed listener unavailable');
    callback([]);
    return () => {};
  }
  const ref = collection(firestoreInstance, COLLECTIONS.feed(groupId));
  const q = query(ref, orderBy('createdAt', 'desc'), limit(pageSize));
  return onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(docs);
  });
}

/**
 * Subscribe to reactions on a specific submission.
 * Returns an unsubscribe function.
 */
export function subscribeToReactions(
  submissionId: string,
  callback: (reactions: any[]) => void
): () => void {
  if (!firestoreInstance) {
    callback([]);
    return () => {};
  }
  const ref = collection(firestoreInstance, COLLECTIONS.reactions(submissionId));
  return onSnapshot(ref, (snapshot) => {
    const docs = snapshot.docs.map((d) => ({ userId: d.id, ...d.data() }));
    callback(docs);
  });
}

/**
 * Subscribe to comments on a specific submission.
 * Returns an unsubscribe function.
 */
export function subscribeToComments(
  submissionId: string,
  callback: (comments: any[]) => void
): () => void {
  if (!firestoreInstance) {
    callback([]);
    return () => {};
  }
  const ref = collection(firestoreInstance, COLLECTIONS.comments(submissionId));
  const q = query(ref, orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(docs);
  });
}

/**
 * Subscribe to in-app notifications for a user.
 * Returns an unsubscribe function.
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notifications: any[]) => void
): () => void {
  if (!firestoreInstance) {
    callback([]);
    return () => {};
  }
  const ref = collection(firestoreInstance, COLLECTIONS.notifications(userId));
  const q = query(ref, orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(docs);
  });
}

export { isFirebaseConfigured };
export default app;

// ─── Legacy Auth Stub ────────────────────────────────────────────────────────
// Firebase Auth was removed in Phase 1.5. The screens still reference
// `firebaseAuth` — they'll be rewritten in Phase 2.1 to use Supabase Auth.
// This stub keeps the rest of the app compiling until that rewrite.
//
// DO NOT IMPORT THIS IN NEW CODE. Use `supabase.auth` instead.

/** @deprecated Use `supabase.auth.signInWithPassword()` instead. */
export const firebaseAuth = {
  get currentUser() {
    if (!app) {
      throw new Error(
        '[firebase] Firebase not configured and Auth was removed in 1.5. ' +
          'Use supabase.auth instead. This stub is for the in-flight auth-screen migration.'
      );
    }
    return null;
  },
};
