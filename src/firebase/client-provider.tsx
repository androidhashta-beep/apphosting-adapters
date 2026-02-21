'use client';

import React, { useMemo, type ReactNode, useEffect, useState } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase, ensureAnonymousSignIn } from '@/firebase';
import { Loader2 } from 'lucide-react';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);

  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return initializeFirebase();
  }, []); // Empty dependency array ensures this runs only once on mount

  useEffect(() => {
    const authenticate = async () => {
      if (firebaseServices.auth) {
        try {
          await ensureAnonymousSignIn(firebaseServices.auth);
          setIsFirebaseReady(true);
        } catch (error) {
          // Handle auth failure. Maybe show an error screen.
          console.error("Firebase authentication failed:", error);
        }
      }
    };
    authenticate();
  }, [firebaseServices.auth]);

  if (!isFirebaseReady) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Connecting to services...</p>
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
