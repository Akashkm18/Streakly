export interface FreezeToken {
  id: string;
  userId: string;
  earnedAtStreak: number;
  isSpent: boolean;
  spentOnDate?: string | null;
  spentHabitId?: string | null;
  createdAt: string;
  spentAt?: string | null;
}

export interface WalletData {
  unspentCount: number;
  maxCapacity: number;
  tokens: FreezeToken[];
}
