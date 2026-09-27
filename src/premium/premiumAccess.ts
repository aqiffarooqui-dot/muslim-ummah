import type { PremiumSubscription } from './premiumTypes';

export function isPremiumActive(
  subscription: PremiumSubscription | null,
  now = Date.now()
): boolean {
  if (
    !subscription ||
    subscription.status !== 'ACTIVE'
  ) {
    return false;
  }

  if (!subscription.expiresAt) {
    return true;
  }

  return (
    new Date(subscription.expiresAt).getTime() >
    now
  );
}
