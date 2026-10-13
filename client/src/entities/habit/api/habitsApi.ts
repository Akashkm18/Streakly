import { apiClient } from '@/shared/api/client';
import { Habit } from '../model/types';

export const habitsApi = {
  list: () => apiClient<Habit[]>('/habits'),
  getById: (id: string) => apiClient<Habit>(`/habits/${id}`),
  create: (data: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    frequency?: string;
    customDays?: number[];
    goalPerDay?: number;
  }) =>
    apiClient<Habit>('/habits', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Habit>) =>
    apiClient<Habit>(`/habits/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiClient(`/habits/${id}`, {
      method: 'DELETE',
    }),
  toggleArchive: (id: string, isArchived: boolean) =>
    apiClient<Habit>(`/habits/${id}/archive`, {
      method: 'PATCH',
      body: JSON.stringify({ isArchived }),
    }),
  checkIn: (data: {
    habitId: string;
    date?: string;
    count?: number;
    journal?: { note?: string; mood: number; energy: number };
  }) =>
    apiClient('/checkins', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  undoCheckIn: (habitId: string, date: string) =>
    apiClient(`/checkins/${habitId}/${date}`, {
      method: 'DELETE',
    }),
};
