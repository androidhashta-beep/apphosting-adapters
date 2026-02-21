
'use client';

import { useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useUser, useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import type { UserProfile } from '@/lib/types';
import { useRouter } from 'next/navigation';

export function useUserProfile() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const userProfileRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );

  const { data: profile, isLoading: isProfileLoading, error } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    // If the user is authenticated but has no profile document, create one.
    if (user && !isProfileLoading && !profile && userProfileRef) {
      const createProfile = async () => {
        try {
            const profileDoc = await getDoc(userProfileRef);
            if (profileDoc.exists()) {
              return; // Profile already exists, do nothing
            }

            // Default all new users to 'staff'.
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || 'anonymous-user',
              displayName: user.displayName || `User ${user.uid.substring(0, 5)}`,
              role: 'staff',
            };
            await setDoc(userProfileRef, newProfile);
        } catch (e) {
            console.error("Failed to create user profile:", e);
        }
      };

      createProfile();
    }
  }, [user, profile, isProfileLoading, userProfileRef]);


  return {
    profile,
    isLoading: isUserLoading || isProfileLoading,
    error,
  };
}
