export type AdminUserSummary = {
  uid: string;
  email: string;
  displayName: string | null;
  role: 'user' | 'admin';
  createdAt: string;
  lastActiveAt: string;
};

export type AdminStats = {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  expiringSoon: number;
  newUsers: number;
};
