'use client';

import React, { useMemo, type ReactNode, useEffect, useState } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
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
    const unsubscribe = onAuthStateChanged(
      firebaseServices.auth,
      (user) => {
        if (user && user.isAnonymous) {
          // If an anonymous user is detected, sign them out immediately.
          // This prevents any part of the app from using a lingering anonymous session,
          // which is the root cause of the recent errors.
          signOut(firebaseServices.auth).finally(() => {
            setIsAuthLoading(false);
          });
        } else {
          // For any other user (or no user), the auth state is resolved.
          setIsAuthLoading(false);
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
