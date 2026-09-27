import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Platform,
} from 'react-native';

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';

import {
  createUserProfile,
  getUserProfile,
  updateUserLastActive,
  type FirestoreUserProfile,
} from '../firebase/firestore';

import {
  auth,
  subscribeToAuth,
  resetPassword,
} from '../firebase/auth';

import { isAdminEmail } from '../admin/adminConfig';

type AuthContextValue = {
  user: User | null;
  profile: FirestoreUserProfile | null;
  loading: boolean;
  isAdmin: boolean;

  signUp: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<void>;

  signIn: (
    email: string,
    password: string
  ) => Promise<void>;

  signInWithGoogle: () => Promise<void>;

  sendResetEmail: (
    email: string
  ) => Promise<void>;

  logout: () => Promise<void>;

  refreshProfile: () => Promise<void>;
};

const AuthContext =
  createContext<AuthContextValue | undefined>(
    undefined
  );

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] =
    useState<User | null>(null);

  const [profile, setProfile] =
    useState<FirestoreUserProfile | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [adminClaim, setAdminClaim] =
    useState(false);

  async function loadProfile(
    firebaseUser: User
  ) {
    try {
      const tokenResult =
        await firebaseUser.getIdTokenResult();

      setAdminClaim(
        tokenResult.claims.admin === true
      );
      let existingProfile =
        await getUserProfile(
          firebaseUser.uid
        );

      if (!existingProfile) {
        const now =
          new Date().toISOString();

        const newProfile: FirestoreUserProfile =
          {
            uid: firebaseUser.uid,
            email:
              firebaseUser.email ?? '',
            displayName:
              firebaseUser.displayName,
            role: isAdminEmail(
              firebaseUser.email
            )
              ? 'admin'
              : 'user',
            createdAt: now,
            lastActiveAt: now,
          };

        await createUserProfile(
          newProfile
        );

        existingProfile =
          newProfile;
      } else {
        await updateUserLastActive(
          firebaseUser.uid
        );
      }

      setProfile(existingProfile);
    } catch (error) {
      console.error(
        'Failed to load user profile:',
        error
      );

      setProfile(null);
    }
  }

  useEffect(() => {
    const unsubscribe =
      subscribeToAuth(
        async (firebaseUser) => {
          setUser(firebaseUser);

          if (firebaseUser) {
            await loadProfile(
              firebaseUser
            );
          } else {
            setProfile(null);
            setAdminClaim(false);
          }

          setLoading(false);
        }
      );

    return unsubscribe;
  }, []);

  async function signUp(
    email: string,
    password: string,
    displayName?: string
  ) {
    const credential =
      await createUserWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

    if (displayName?.trim()) {
      await updateProfile(
        credential.user,
        {
          displayName:
            displayName.trim(),
        }
      );
    }

    await loadProfile(
      credential.user
    );
  }

  async function signIn(
    email: string,
    password: string
  ) {
    const credential =
      await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

    await loadProfile(
      credential.user
    );
  }

  async function signInWithGoogle() {
    if (Platform.OS !== 'web') {
      throw new Error(
        'Google Sign-In is currently available on the web version. Native Google authentication will be connected during the Android/iOS build.'
      );
    }

    const provider =
      new GoogleAuthProvider();

    provider.setCustomParameters({
      prompt: 'select_account',
    });

    const result =
      await signInWithPopup(
        auth,
        provider
      );

    await loadProfile(
      result.user
    );
  }

  async function sendResetEmail(
    email: string
  ) {
    await resetPassword(email);
  }

  async function logout() {
    await signOut(auth);
  }

  async function refreshProfile() {
    if (!user) {
      return;
    }

    await loadProfile(user);
  }

  const value =
    useMemo<AuthContextValue>(
      () => ({
        user,
        profile,
        loading,
        isAdmin:
          adminClaim ||
          profile?.role === 'admin' ||
          isAdminEmail(user?.email),
        signUp,
        signIn,
        signInWithGoogle,
        sendResetEmail,
        logout,
        refreshProfile,
      }),
      [
        user,
        profile,
        loading,
      ]
    );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider'
    );
  }

  return context;
}
