'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

export function initializeFirebase() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  // Connect to emulators unconditionally for offline-first approach
  // The app is designed to run in a local network environment.
  // We use the local IP of the server PC running the emulators.
  const EMULATOR_HOST = '10.30.0.250';
  console.log(`[Firebase] App is connecting to emulators at ${EMULATOR_HOST}.`);
  connectAuthEmulator(auth, `http://${EMULATOR_HOST}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(firestore, EMULATOR_HOST, 8080);
  
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
