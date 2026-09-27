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

  const [loading, setLoading] =
    useState(true);

  async function refreshPremium() {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const result =
        await getPremiumSubscription(
          user.uid
        );

      setSubscription(result);
    } catch (error) {
      console.error(
        'Premium loading error:',
        error
      );

      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshPremium();
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

  const isPremium =
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
