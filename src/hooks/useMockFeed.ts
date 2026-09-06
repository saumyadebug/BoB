import { useState, useEffect } from 'react';
import { Submission, User, Reaction } from '@/types';

// Mock Users
const mockUsers: User[] = [
  {
    id: 'user1',
    email: 'mark@example.com',
    username: 'mj24',
    displayName: 'Mark Jenkins',
    avatarUrl: 'https://i.pravatar.cc/150?u=user1',
    xp: 4500,
    level: 4,
    totalSubmissions: 45,
    longestStreak: 21,
    shieldsAvailable: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'user2',
    email: 'sarah@example.com',
    username: 'sarah_runs',
    displayName: 'Sarah Connor',
    avatarUrl: 'https://i.pravatar.cc/150?u=user2',
    xp: 8200,
    level: 5,
    totalSubmissions: 82,
    longestStreak: 45,
    shieldsAvailable: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// Mock Activities
export const mockTodayActivities = [
  {
    id: 'act1',
    name: 'Morning Gym',
    icon: 'dumbbell',
    color: '#2ECC71',
    status: 'pending', // 'pending' | 'submitted'
    currentValue: 45,
    limitValue: 60,
    unit: 'min'
  },
  {
    id: 'act2',
    name: '30m Run',
    icon: 'shoe-sneaker',
    color: '#E67E22',
    status: 'submitted',
    currentValue: 32,
    limitValue: 30,
    unit: 'min'
  },
  {
    id: 'act3',
    name: 'Hydrate',
    icon: 'water',
    color: '#3498DB',
    status: 'pending',
    currentValue: 1.5,
    limitValue: 3,
    unit: 'L'
  },
  {
    id: 'act4',
    name: 'Read 30p',
    icon: 'book-open-variant',
    color: '#9B59B6',
    status: 'submitted',
    currentValue: 35,
    limitValue: 30,
    unit: 'pages'
  }
];

export type MockFeedItem = Submission & {
  groupName: string;
  streakCount: number;
  initialReactions: Reaction[];
  commentCount: number;
  groupColor: string;
};

// Mock Feed Submissions
const mockFeed: MockFeedItem[] = [
  {
    id: 'sub1',
    userId: 'user1',
    activityId: 'act1',
    groupId: 'group1',
    groupName: 'GYM PACT',
    groupColor: '#2ECC71',
    photoUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop',
    title: 'Chest & Triceps - 75 min',
    description: 'Pushed hard today. PR on bench! 💪',
    fieldValues: {},
    xpEarned: 60,
    clientTimestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    user: mockUsers[0],
    streakCount: 14,
    initialReactions: [
      { submissionId: 'sub1', userId: 'user2', emoji: '🔥', createdAt: new Date().toISOString() },
      { submissionId: 'sub1', userId: 'user3', emoji: '💪', createdAt: new Date().toISOString() },
    ],
    commentCount: 7,
  },
  {
    id: 'sub2',
    userId: 'user2',
    activityId: 'act2',
    groupId: 'group2',
    groupName: 'RUNNERS',
    groupColor: '#E67E22',
    photoUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=1470&auto=format&fit=crop',
    title: 'Morning 5K',
    description: 'Beautiful sunrise run by the lake.',
    fieldValues: {},
    xpEarned: 50,
    clientTimestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    user: mockUsers[1],
    streakCount: 45,
    initialReactions: [
      { submissionId: 'sub2', userId: 'user1', emoji: '👏', createdAt: new Date().toISOString() },
    ],
    commentCount: 2,
  }
];

import { fetchAggregatedFeed } from '@/services/feedService';

export function useMockFeed(filterUserId?: string) {
  const [feed, setFeed] = useState<MockFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFeed = async () => {
    try {
      const realItems = await fetchAggregatedFeed(20, filterUserId);
      if (realItems.length > 0) {
        setFeed(realItems);
      } else {
        setFeed(mockFeed);
      }
    } catch {
      setFeed(mockFeed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, [filterUserId]);

  return {
    data: feed,
    isLoading: loading,
    isError: false,
    refetch: () => {
      setLoading(true);
      loadFeed();
    },
  };
}

export const useLiveFeed = useMockFeed;
