'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

export function initializeFirebase() {
  // Hardcode a minimal config for emulator-only use.
  // The actual values don't matter much when connecting to emulators,
  // but they must be non-empty strings. This avoids the SDK getting
  // confused by a production config when running in an Electron app.
  const emulatorConfig = {
      apiKey: "emulator-api-key",
      authDomain: "localhost",
      projectId: "studio-2232077555-525b9",
  };

  const app = getApps().length ? getApp() : initializeApp(emulatorConfig);
  
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  // This application is designed for OFFLINE use.
  // It will ALWAYS connect to the local emulators, regardless of environment.
  // IMPORTANT: If you run the packaged application on a different computer
  // than the one running the emulators, replace 'localhost' below
  // with the IP address of the server PC.
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
