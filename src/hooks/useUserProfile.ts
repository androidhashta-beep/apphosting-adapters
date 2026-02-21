'use client';

import { useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { useUser, useDoc, useFirebase, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import type { UserProfile } from '@/lib/types';

export function useUserProfile() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();

  const userProfileRef = useMemoFirebase(
    () => (firestore && user && !user.isAnonymous ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );

  const { data: profile, isLoading: isProfileLoading, error } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    // If the user is authenticated but has no profile document, create one.
    if (user && !user.isAnonymous && !isProfileLoading && !profile && userProfileRef) {
        const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email || 'unknown',
            displayName: user.displayName || user.email?.split('@')[0] || 'New User',
            role: 'staff', // Default role for new users
        };
        // Use non-blocking update to avoid awaiting here
        setDocumentNonBlocking(userProfileRef, newProfile, {});
    }
  }, [user, profile, isProfileLoading, userProfileRef]);

  return {
    profile,
    isLoading: isUserLoading || isProfileLoading,
    error,
  };
}
