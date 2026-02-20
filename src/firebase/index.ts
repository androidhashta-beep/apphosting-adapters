'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

export function initializeFirebase() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
    console.log("Connecting to local Firebase emulators...");
    // NOTE: The IP address '10.30.0.250' is a placeholder.
    // This must be replaced with the actual IP address of the server PC running the emulators.
    connectAuthEmulator(auth, 'http://10.30.0.250:9099', { disableWarnings: true });
    connectFirestoreEmulator(firestore, '10.30.0.250', 8080);
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
