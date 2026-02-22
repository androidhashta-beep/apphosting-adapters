
'use client';

import { useEffect } from 'react';
import { doc, getDoc, type DocumentReference } from 'firebase/firestore';
import { useUser, useDoc, useFirebase, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import type { UserProfile } from '@/lib/types';
import type { User } from 'firebase/auth';

export function useUserProfile() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();

  const userProfileRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );

  const { data: profile, isLoading: isProfileLoading, error } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    // This async function is defined inside the effect to capture the correct scope.
    const createProfileIfNeeded = async (currentUser: User, profileRef: DocumentReference) => {
      try {
        const profileDoc = await getDoc(profileRef);
        if (profileDoc.exists()) {
          return; // Profile already exists, do nothing.
        }

        // Default all new users to 'admin'.
        const newProfile: UserProfile = {
          uid: currentUser.uid,
          email: currentUser.email || 'anonymous-user',
          displayName: currentUser.displayName || `User ${currentUser.uid.substring(0, 5)}`,
          role: 'admin',
        };

        // Use the project's non-blocking update function for consistency and better error handling.
        setDocumentNonBlocking(profileRef, newProfile, { merge: false });

      } catch (e) {
        console.error("Failed to create user profile:", e);
      }
    };

    // This condition ensures we only try to create a profile when all dependencies are ready
    // and a profile is actually needed.
    if (user && !isProfileLoading && !profile && userProfileRef) {
      createProfileIfNeeded(user, userProfileRef);
    }
  }, [user, isProfileLoading, profile, userProfileRef]);


  return {
    profile,
    isLoading: isUserLoading || isProfileLoading,
    error,
  };
}
