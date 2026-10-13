import { create } from 'zustand';
import { User } from './types';
import { apiClient } from '@/shared/api/client';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const res = await apiClient<{ user: User }>('/auth/me');
      set({ user: res.user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  logout: async () => {
    try {
      await apiClient('/auth/logout', { method: 'POST' });
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
