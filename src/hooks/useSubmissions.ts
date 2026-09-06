import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES, QUERY_KEYS } from '@/services/queryClient';
import {
  Submission,
  CreateSubmissionInput,
  UpdateSubmissionInput,
} from '@/types';
import {
  createSubmission,
  updateSubmission,
  deleteSubmission,
  fetchGroupSubmissions,
  fetchUserSubmissions,
  fetchActivitySubmissions,
  getSubmissionById,
} from '@/services/submissionService';

/**
 * React Query hooks for submissions.
 * Supports reading feeds, personal history, and mutations for create, edit, delete.
 */

// ─── Query Hooks ─────────────────────────────────────────────────────────────

export function useGroupSubmissions(groupId: string, limit: number = 20) {
  return useQuery({
    queryKey: [...QUERY_KEYS.submissions(groupId, 'group'), limit] as const,
    queryFn: () => fetchGroupSubmissions(groupId, limit),
    enabled: Boolean(groupId && groupId.length > 0),
    staleTime: STALE_TIMES.feed,
  });
}

export function useUserSubmissions(userId: string, limit: number = 50) {
  return useQuery({
    queryKey: [...QUERY_KEYS.submissions(userId, 'user'), limit] as const,
    queryFn: () => fetchUserSubmissions(userId, limit),
    enabled: Boolean(userId && userId.length > 0),
    staleTime: STALE_TIMES.feed,
  });
}

export function useActivitySubmissions(activityId: string, limit: number = 30) {
  return useQuery({
    queryKey: [...QUERY_KEYS.submissions(activityId, 'activity'), limit] as const,
    queryFn: () => fetchActivitySubmissions(activityId, limit),
    enabled: Boolean(activityId && activityId.length > 0),
    staleTime: STALE_TIMES.calendar,
  });
}

export function useSubmissionDetail(submissionId: string) {
  return useQuery({
    queryKey: ['submission', submissionId] as const,
    queryFn: () => getSubmissionById(submissionId),
    enabled: Boolean(submissionId && submissionId.length > 0),
    staleTime: STALE_TIMES.feed,
  });
}

// ─── Mutation Hooks ──────────────────────────────────────────────────────────

export function useCreateSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSubmissionInput) => createSubmission(input),
    onSuccess: (newSubmission) => {
      // Invalidate relevant feeds and user caches
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.submissions(newSubmission.groupId, 'group'),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.submissions(newSubmission.userId, 'user'),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.submissions(newSubmission.activityId, 'activity'),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.streaks(newSubmission.userId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.currentUser,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.group(newSubmission.groupId),
      });
    },
  });
}

export function useUpdateSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      submissionId,
      input,
    }: {
      submissionId: string;
      input: UpdateSubmissionInput;
    }) => updateSubmission(submissionId, input),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['submission', updated.id] });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.submissions(updated.groupId, 'group'),
      });
    },
  });
}

export function useDeleteSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (submissionId: string) => deleteSubmission(submissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.currentUser });
    },
  });
}
