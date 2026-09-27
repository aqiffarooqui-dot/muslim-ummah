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
  const { user } = useAuth();

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

  const isPremium =
    isPremiumActive(
      subscription
    );

  const value =
    useMemo(
      () => ({
        subscription,
        isPremium,
        loading,
        refreshPremium,
      }),
      [
        subscription,
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
