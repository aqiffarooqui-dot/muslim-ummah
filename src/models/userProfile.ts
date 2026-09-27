export type UserRole = 'user' | 'admin';

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  createdAt: string;
  lastActiveAt: string;
};
