
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
    const createProfileIfNeeded = async (currentUser: User, profileRef: DocumentReference) => {
      // Never create a profile for anonymous users
      if (currentUser.isAnonymous) {
        return;
      }
      
      try {
        const profileDoc = await getDoc(profileRef);
        if (profileDoc.exists()) {
          return; // Profile already exists, do nothing.
        }

        // Default new users to 'staff'. Admins must be manually promoted in Firestore.
        const newProfile: UserProfile = {
          uid: currentUser.uid,
          email: currentUser.email || `user-${currentUser.uid.substring(0,5)}@example.com`,
          displayName: currentUser.displayName || `User ${currentUser.uid.substring(0, 5)}`,
          role: 'staff',
        };

        setDocumentNonBlocking(profileRef, newProfile, { merge: false });

      } catch (e) {
        console.error("Failed to create user profile:", e);
      }
    };

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
