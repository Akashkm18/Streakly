import { apiClient } from '@/shared/api/client';
import { WalletData } from '../model/types';

export const tokensApi = {
  getWallet: () => apiClient<WalletData>('/tokens/wallet'),
  spendToken: (habitId: string, date: string) =>
    apiClient('/tokens/spend', {
      method: 'POST',
      body: JSON.stringify({ habitId, date }),
    }),
};
