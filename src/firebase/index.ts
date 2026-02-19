'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    // Important! initializeApp() is called without any arguments because Firebase App Hosting
    // integrates with the initializeApp() function to provide the environment variables needed to
    // populate the FirebaseOptions in production. It is critical that we attempt to call initializeApp()
    // without arguments.
    let firebaseApp;
    try {
      // Attempt to initialize via Firebase App Hosting environment variables
      firebaseApp = initializeApp();
    } catch (e) {
      // Only warn in production because it's normal to use the firebaseConfig to initialize
      // during development
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      firebaseApp = initializeApp(firebaseConfig);
    }

    return getSdks(firebaseApp);
  }

  // If already initialized, return the SDKs with the already initialized App
  return getSdks(getApp());
}

// Flag to ensure emulators are connected only once.
let emulatorsConnected = false;

export function getSdks(firebaseApp: FirebaseApp) {
  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);

  // If the emulator host is set, connect to the emulators.
  // This is used for local, offline development.
  const host = process.env.NEXT_PUBLIC_EMULATOR_HOST;

  if (host && !emulatorsConnected) {
    const firestorePort = parseInt(process.env.NEXT_PUBLIC_FIRESTORE_PORT || '8080', 10);
    const authPort = parseInt(process.env.NEXT_PUBLIC_AUTH_PORT || '9099', 10);

    console.log(`[Firebase] Connecting to emulators on ${host}:${firestorePort}`);
    
    connectFirestoreEmulator(firestore, host, firestorePort);
    connectAuthEmulator(auth, `http://${host}:${authPort}`);
    
    emulatorsConnected = true;
  }

  return {
    firebaseApp,
    auth,
    firestore
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
