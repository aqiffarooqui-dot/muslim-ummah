import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getPremiumSubscription,
} from './premiumService';

import {
  isPremiumActive,
} from './premiumAccess';

import type {
  PremiumSubscription,
} from './premiumTypes';

import { useAuth } from '../auth/AuthProvider';

type PremiumContextValue = {
  subscription:
    | PremiumSubscription
    | null;

  isPremium: boolean;

  loading: boolean;

  refreshPremium: () => Promise<void>;
};

const PremiumContext =
  createContext<
    PremiumContextValue | undefined
  >(undefined);

// Premium entitlement must be refreshed from the server regularly.
// This prevents a user from disabling network access and keeping an old
// in-memory ACTIVE entitlement indefinitely.
const PREMIUM_VERIFICATION_WINDOW_MS =
  5 * 60 * 1000;

const PREMIUM_REFRESH_INTERVAL_MS =
  5 * 60 * 1000;

export function PremiumProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin } = useAuth();

  const [
    subscription,
    setSubscription,
  ] =
    useState<PremiumSubscription | null>(
      null
    );

  const [
    verifiedAt,
    setVerifiedAt
  ] = useState<number>(0);

  const [loading, setLoading] =
    useState(true);

  async function refreshPremium() {
    if (!user) {
      setSubscription(null);
      setVerifiedAt(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // getPremiumSubscription() uses getDocFromServer(), so an offline
      // Firestore cache can never silently grant Premium.
      const result =
        await getPremiumSubscription(
          user.uid
        );

      setSubscription(result);
      setVerifiedAt(Date.now());
    } catch (error) {
      console.error(
        'Premium server verification failed:',
        error
      );

      // Fail closed: no network/server verification = no Premium.
      setSubscription(null);
      setVerifiedAt(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshPremium();

    const intervalId =
      window.setInterval(
        refreshPremium,
        PREMIUM_REFRESH_INTERVAL_MS
      );

    return () =>
      window.clearInterval(intervalId);
  }, [user?.uid]);

  const effectiveSubscription =
    isAdmin
      ? {
          userId: user?.uid ?? 'admin',
          planId: 'lifetime',
          status: 'ACTIVE' as const,
          startedAt: '2026-09-27T00:00:00.000Z',
          expiresAt: null,
          source: 'ADMIN' as const,
          paymentId: null,
          autoRenew: false,
        }
      : subscription;

  const serverVerificationFresh =
    isAdmin ||
    (
      verifiedAt > 0 &&
      Date.now() - verifiedAt <
        PREMIUM_VERIFICATION_WINDOW_MS
    );

  const isPremium =
    serverVerificationFresh &&
    isPremiumActive(
      effectiveSubscription
    );

  const value =
    useMemo(
      () => ({
        subscription: effectiveSubscription,
        isPremium,
        loading,
        refreshPremium,
      }),
      [
        effectiveSubscription,
        isPremium,
        loading,
        verifiedAt,
      ]
    );

  return (
    <PremiumContext.Provider
      value={value}
    >
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const context =
    useContext(PremiumContext);

  if (!context) {
    throw new Error(
      'usePremium must be used inside PremiumProvider'
    );
  }

  return context;
}
