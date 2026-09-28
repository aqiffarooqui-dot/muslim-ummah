import { getApp, getApps, initializeApp } from 'firebase/app';

// Firebase web configuration is public client configuration.
// Environment variables can override these values in CI/hosting, while the
// built-in values keep the web app from crashing when a host has no env vars.
const firebaseConfig = {
  apiKey:
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY ||
    'AIzaSyCJJWZ0tNnFqKyGHqjf9jKW3q4L2D294CE',
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    'muslim-ummah-d970c.firebaseapp.com',
  projectId:
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
    'muslim-ummah-d970c',
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    'muslim-ummah-d970c.firebasestorage.app',
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    '518938483883',
  appId:
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID ||
    '1:518938483883:web:97f907714aa09be8ee2bee',
};

export const firebaseApp =
  getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig);
