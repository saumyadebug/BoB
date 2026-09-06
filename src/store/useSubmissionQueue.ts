import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uploadSubmissionPhoto } from '@/services/storageService';
import { createSubmission } from '@/services/submissionService';
import { queryClient, QUERY_KEYS } from '@/services/queryClient';
import { isAppError } from '@/services/errors';

export interface QueuedSubmission {
  id: string;
  activityId: string;
  groupId: string;
  timestamp: string;
  title?: string;
  description?: string;
  fieldsData?: Record<string, any>;
  photoUri?: string;
  status: 'pending' | 'syncing' | 'failed';
  errorMessage?: string;
}

interface SubmissionQueueState {
  queue: QueuedSubmission[];
  isSyncing: boolean;
  addSubmission: (submission: Omit<QueuedSubmission, 'status'>) => void;
  removeSubmission: (id: string) => void;
  updateStatus: (id: string, status: QueuedSubmission['status'], errorMessage?: string) => void;
  clearQueue: () => void;
  syncQueue: (userId: string) => Promise<{ successCount: number; failCount: number }>;
}

export const useSubmissionQueue = create<SubmissionQueueState>()(
  persist(
    (set, get) => ({
      queue: [],
      isSyncing: false,

      addSubmission: (submission) =>
        set((state) => ({
          queue: [...state.queue, { ...submission, status: 'pending' }],
        })),

      removeSubmission: (id) =>
        set((state) => ({
          queue: state.queue.filter((s) => s.id !== id),
        })),

      updateStatus: (id, status, errorMessage) =>
        set((state) => ({
          queue: state.queue.map((s) =>
            s.id === id ? { ...s, status, errorMessage } : s
          ),
        })),

      clearQueue: () => set({ queue: [] }),

      syncQueue: async (userId: string) => {
        const { queue, isSyncing, removeSubmission, updateStatus } = get();
        if (isSyncing || queue.length === 0) {
          return { successCount: 0, failCount: 0 };
        }

        set({ isSyncing: true });
        let successCount = 0;
        let failCount = 0;

        const pendingItems = queue.filter((item) => item.status !== 'syncing');

        for (const item of pendingItems) {
          try {
            updateStatus(item.id, 'syncing');

            // 1. Upload photo if local URI provided
            let uploadedPhotoUrl: string | null = null;
            if (item.photoUri) {
              if (
                item.photoUri.startsWith('http://') ||
                item.photoUri.startsWith('https://')
              ) {
                uploadedPhotoUrl = item.photoUri;
              } else {
                uploadedPhotoUrl = await uploadSubmissionPhoto(
                  userId,
                  item.activityId,
                  item.photoUri
                );
              }
            }

            // 2. Insert submission preserving original client timestamp
            await createSubmission({
              activityId: item.activityId,
              groupId: item.groupId,
              photoUrl: uploadedPhotoUrl,
              title: item.title,
              description: item.description,
              fieldValues: item.fieldsData,
              clientTimestamp: item.timestamp,
            });

            // 3. Remove on success
            removeSubmission(item.id);
            successCount++;
          } catch (err: any) {
            console.warn('[useSubmissionQueue] Failed to sync item:', item.id, err);
            failCount++;

            if (isAppError(err) && err.code === 'DUPLICATE_SUBMISSION') {
              // Already submitted today; discard to unblock queue
              removeSubmission(item.id);
            } else {
              updateStatus(item.id, 'failed', err?.message || 'Sync failed');
            }
          }
        }

        // Invalidate relevant React Query caches
        if (successCount > 0) {
          queryClient.invalidateQueries({ queryKey: ['feed'] });
          queryClient.invalidateQueries({ queryKey: ['submissions'] });
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.currentUser });
        }

        set({ isSyncing: false });
        return { successCount, failCount };
      },
    }),
    {
      name: 'submission-queue-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
