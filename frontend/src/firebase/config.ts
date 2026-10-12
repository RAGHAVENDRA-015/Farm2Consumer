import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { env } from '../config/env';

const isFakeKey = !env.FIREBASE_API_KEY || env.FIREBASE_API_KEY.includes('FakeKey');

export const isFirebaseConfigured = !isFakeKey;

const firebaseConfig = {
  apiKey: env.FIREBASE_API_KEY,
  authDomain: env.FIREBASE_AUTH_DOMAIN,
  projectId: env.FIREBASE_PROJECT_ID,
  storageBucket: env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
  appId: env.FIREBASE_APP_ID,
};

// Initialize Firebase safely; avoid initializing with dummy keys to prevent iframe errors
export const app = isFirebaseConfigured
  ? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig))
  : ({} as any);

export const auth: Auth = isFirebaseConfigured
  ? getAuth(app)
  : ({} as any);

