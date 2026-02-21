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
        const profileDoc = await getDoc(userProfileRef);
        if (profileDoc.exists()) {
          return; // Profile already exists, do nothing
        }

        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || 'unknown',
          displayName: user.displayName || user.email?.split('@')[0] || 'New User',
          role: 'staff', // Default role
          mustChangePassword: false,
        };
        await setDoc(userProfileRef, newProfile);
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
