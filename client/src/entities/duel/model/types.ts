export interface DuelParticipant {
  id: string;
  userId: string;
  name: string;
  avatarUrl?: string | null;
  score: number;
  targetDays?: number;
  progressPercent: number;
  checkedInToday: boolean;
  checkInDates?: string[];
}

export interface Duel {
  id: string;
  title: string;
  inviteCode: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
  startDate: string;
  endDate: string;
  targetDays: number;
  daysRemaining: number;
  creator: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
  participants: DuelParticipant[];
}
