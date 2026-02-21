'use client';

import React, { useMemo, type ReactNode, useEffect, useState } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({
  children,
}: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    return initializeFirebase();
  }, []);

  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    // This effect runs once to ensure we have an authenticated user.
    // It's separate from the listener inside FirebaseProvider because
    // this one *initiates* sign-in, while the other just *reports* state.
    const unsubscribe = onAuthStateChanged(
      firebaseServices.auth,
      async (currentUser) => {
        if (currentUser) {
          setIsAuthLoading(false);
        } else {
          try {
            await signInAnonymously(firebaseServices.auth);
          } catch (error) {
            console.error('Anonymous sign-in failed', error);
            // In case of error, we stop loading to not block the app,
            // though some parts might not work.
          } finally {
            // onAuthStateChanged will fire again with the new user,
            // which will set isLoading to false. If it fails,
            // this ensures we don't load forever.
             setIsAuthLoading(false);
          }
        }
      }
    );

    return () => unsubscribe();
  }, [firebaseServices.auth]);

  if (isAuthLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Connecting to services...</p>
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
