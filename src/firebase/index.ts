'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Flag to ensure emulators are connected only once. This is to prevent errors during hot-reloading.
let emulatorsConnected = false;

export function initializeFirebase() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  // This logic ensures we're connecting to the emulators for local/offline development.
  // The NEXT_PUBLIC_EMULATOR_HOST should be set in a .env file (e.g., to 127.0.0.1)
  const host = process.env.NEXT_PUBLIC_EMULATOR_HOST;

  if (host && !emulatorsConnected) {
    console.log(`[Firebase] Connecting to emulators on ${host}`);
    try {
      connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
      connectFirestoreEmulator(firestore, host, 8080);
      emulatorsConnected = true;
    } catch (e) {
      console.error('[Firebase] Error connecting to emulators:', e);
    }
  } else if (!emulatorsConnected) {
    console.warn('[Firebase] App is connecting to LIVE services. For offline mode, ensure NEXT_PUBLIC_EMULATOR_HOST is set in your .env file and restart the development server.');
  }

  return {
    firebaseApp: app,
    auth,
    firestore,
  };
}


export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';