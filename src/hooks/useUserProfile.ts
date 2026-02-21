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
    () => (firestore && user && !user.isAnonymous ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );

  const { data: profile, isLoading: isProfileLoading, error } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    // If the user is authenticated but has no profile document, create one.
    if (user && !user.isAnonymous && !isProfileLoading && !profile && userProfileRef) {
      const createProfile = async () => {
        try {
            const profileDoc = await getDoc(userProfileRef);
            if (profileDoc.exists()) {
              return; // Profile already exists, do nothing
            }

            // Default all new users to 'staff' to ensure stable login.
            // Admin promotion is a manual step for now.
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || 'unknown',
              displayName: user.displayName || user.email?.split('@')[0] || 'New User',
              role: 'staff', 
              mustChangePassword: true, // Force password change for all new users.
            };
            await setDoc(userProfileRef, newProfile);
        } catch (e) {
            console.error("Failed to create user profile:", e);
        }
      };

      createProfile();
    }
  }, [user, profile, isProfileLoading, userProfileRef]);

  useEffect(() => {
    // This effect ensures that if a user already has a profile but needs to change their password,
    // they are redirected from any page they land on.
    if (profile?.mustChangePassword) {
      const currentPath = window.location.pathname;
      const redirectParam = currentPath !== '/' ? `?redirect=${currentPath}` : '';
      const targetPath = `/change-password${redirectParam}`;
      if (currentPath !== '/change-password') {
        router.replace(targetPath);
      }
    }
  }, [profile, router]);


  return {
    profile,
    isLoading: isUserLoading || isProfileLoading,
    error,
  };
}
