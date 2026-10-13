import { apiClient } from '@/shared/api/client';
import { Duel } from '../model/types';

export const duelsApi = {
  create: (data: { title: string; targetDays?: number; habitId?: string }) =>
    apiClient<Duel>('/duels', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getByCode: (inviteCode: string) => apiClient<Duel>(`/duels/${inviteCode}`),
  join: (inviteCode: string) =>
    apiClient<Duel>(`/duels/${inviteCode}/join`, {
      method: 'POST',
    }),
  checkIn: (duelId: string) =>
    apiClient<Duel>(`/duels/${duelId}/checkin`, {
      method: 'POST',
    }),
  listMy: () => apiClient<Duel[]>('/duels/my'),
};
