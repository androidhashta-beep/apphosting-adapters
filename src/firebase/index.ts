'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

export function initializeFirebase() {
  // Hardcode a minimal, completely generic config for emulator-only use.
  // This helps ensure the SDK doesn't make any assumptions about connecting
  // to production services, which can be a source of issues in a
  // firewalled desktop environment.
  const emulatorConfig = {
      apiKey: "emulator-only",
      authDomain: "localhost.firebaseapp.com",
      projectId: "demo-local-project",
  };

  const app = getApps().length ? getApp() : initializeApp(emulatorConfig);
  
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  // This application is designed for OFFLINE use.
  // It will ALWAYS connect to the local emulators, regardless of environment.
  // Using 'localhost' instead of '127.0.0.1' can sometimes bypass
  // firewall issues on certain systems, which is a common problem
  // in desktop application environments.
  const EMULATOR_HOST = 'localhost'; 

  console.log(`[Firebase Init] Attempting to connect to emulators at ${EMULATOR_HOST}`);
  
  connectAuthEmulator(auth, `http://${EMULATOR_HOST}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(firestore, EMULATOR_HOST, 8080);

  console.log('[Firebase Init] Emulator connection configured.');
  
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
