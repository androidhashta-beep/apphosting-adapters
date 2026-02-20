'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

export function initializeFirebase() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  // This application is designed for OFFLINE use.
  // It will ALWAYS connect to the local emulators, regardless of environment.
  if (typeof window !== 'undefined') {
    // IMPORTANT: If you run the packaged application on a different computer
    // than the one running the emulators, replace 'localhost' below
    // with the IP address of the server PC.
    const EMULATOR_HOST = 'localhost'; 

    console.log(`Connecting to Firebase emulators at ${EMULATOR_HOST}...`);
    
    connectAuthEmulator(auth, `http://${EMULATOR_HOST}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(firestore, EMULATOR_HOST, 8080);
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
