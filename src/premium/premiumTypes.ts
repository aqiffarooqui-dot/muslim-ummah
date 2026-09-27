export type PremiumStatus =
  | 'FREE'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'CANCELLED';

export type PremiumSource =
  | 'ADMIN'
  | 'PAYMENT'
  | 'PROMO'
  | 'SYSTEM';

export type PremiumSubscription = {
  userId: string;
  planId: string;
  status: PremiumStatus;
  startedAt: string;
  expiresAt: string | null;
  source: PremiumSource;
  paymentId?: string | null;
  autoRenew?: boolean;
};

export const PREMIUM_PLANS = [
  {
    id: '7d',
    name: '7 Days',
    durationDays: 7,
  },
  {
    id: '30d',
    name: '30 Days',
    durationDays: 30,
  },
  {
    id: '90d',
    name: '90 Days',
    durationDays: 90,
  },
  {
    id: '180d',
    name: '180 Days',
    durationDays: 180,
  },
  {
    id: '365d',
    name: '1 Year',
    durationDays: 365,
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    durationDays: null,
  },
] as const;
