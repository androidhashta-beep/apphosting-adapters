
'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';
import { Loader2 } from 'lucide-react';

function initializeFirebase() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  return {
    firebaseApp: app,
    auth,
    firestore,
  };
}

interface FirebaseServices {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({
  children,
}: FirebaseClientProviderProps) {
  const [firebaseServices, setFirebaseServices] =
    useState<FirebaseServices | null>(null);

  useEffect(() => {
    // This ensures Firebase is only initialized on the client side,
    // after the component has mounted.
    setFirebaseServices(initializeFirebase());
  }, []);

  if (!firebaseServices) {
    // Render a loading state while Firebase is initializing.
    // This prevents children from trying to access Firebase context too early
    // and provides feedback to the user.
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Initializing Application...</p>
        </div>
      </div>
    );
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
