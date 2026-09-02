import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { User } from '@/types';

/**
 * Auth store — single source of truth for the current user + session.
 *
 * Populated by the `useAuthSync` listener (1.5.6) that watches
 * `supabase.auth.onAuthStateChange`. Screens should NOT call `setUser`
 * directly — that's an anti-pattern that gets out of sync with the session.
 */

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: user !== null,
      isLoading: false,
    }),

  setSession: (session) =>
    set({
      session,
      isAuthenticated: session !== null,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  logout: () =>
    set({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
    }),
}));
