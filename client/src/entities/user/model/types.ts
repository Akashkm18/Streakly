export interface User {
  id: string;
  name: string;
  email: string;
  timezone: string;
  avatarUrl?: string | null;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}
