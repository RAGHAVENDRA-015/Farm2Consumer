import * as admin from 'firebase-admin';
import { env } from './env';
import { logger } from '../utils/logger';

let firebaseAdminApp: admin.app.App | null = null;

export function getFirebaseAdmin(): admin.app.App {
  if (firebaseAdminApp) {
    return firebaseAdminApp;
  }

  if (admin.apps.length > 0 && admin.apps[0]) {
    firebaseAdminApp = admin.apps[0];
    return firebaseAdminApp;
  }

  if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    const formattedPrivateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

    firebaseAdminApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: formattedPrivateKey,
      }),
    });
    logger.info('Firebase Admin SDK initialized successfully');
  } else {
    logger.warn('Firebase Admin SDK credentials not fully configured. Using default application credentials if available.');
    firebaseAdminApp = admin.initializeApp();
  }

  return firebaseAdminApp;
}

export const firebaseAuth = () => getFirebaseAdmin().auth();

