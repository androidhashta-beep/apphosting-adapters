'use client';

import { useEffect } from 'react';
import { doc, runTransaction } from 'firebase/firestore';
import { useUser, useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import type { UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export function useUserProfile() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const userProfileRef = useMemoFirebase(
    () => (firestore && user && !user.isAnonymous ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );

  const { data: profile, isLoading: isProfileLoading, error } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    // If the user is authenticated but has no profile document, create one.
    if (user && !user.isAnonymous && !isProfileLoading && !profile && userProfileRef && firestore) {
      
      const createProfileWithRole = async () => {
        try {
          await runTransaction(firestore, async (transaction) => {
            const settingsRef = doc(firestore, 'settings', 'app');
            
            // Re-check if profile exists inside transaction to prevent race conditions.
            const freshProfileDoc = await transaction.get(userProfileRef);
            if (freshProfileDoc.exists()) {
              return; // Profile was created by another process, abort.
            }
            
            const settingsDoc = await transaction.get(settingsRef);
            const firstUserHasBeenCreated = settingsDoc.exists() && settingsDoc.data().firstUserCreated === true;

            let role: 'admin' | 'staff';
            let mustChangePassword: boolean;

            if (!firstUserHasBeenCreated) {
                role = 'admin';
                mustChangePassword = true;
                if (settingsDoc.exists()) {
                    transaction.update(settingsRef, { firstUserCreated: true });
                } else {
                    transaction.set(settingsRef, { firstUserCreated: true }, { merge: true });
                }
            } else {
                role = 'staff';
                mustChangePassword = false;
            }

            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || 'unknown',
              displayName: user.displayName || user.email?.split('@')[0] || 'New User',
              role: role,
              mustChangePassword: mustChangePassword,
            };
            
            transaction.set(userProfileRef, newProfile);
            
            return { isFirstUser: !firstUserHasBeenCreated, mustChange: mustChangePassword };

          }).then((result) => {
              if (result) {
                if (result.isFirstUser) {
                  toast({
                      title: "Welcome, Administrator!",
                      description: "You have been assigned the admin role. You will be asked to change your password for security.",
                      duration: 8000,
                  });
                }
                if (result.mustChange) {
                    router.replace('/change-password');
                }
              }
          });
        } catch (e) {
            console.error("User profile creation transaction failed: ", e);
            toast({
                variant: 'destructive',
                title: 'Profile Creation Failed',
                description: 'Could not create your user profile. Please try logging in again.'
            })
        }
      };

      createProfileWithRole();
    }
  }, [user, profile, isProfileLoading, userProfileRef, firestore, toast, router]);

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
