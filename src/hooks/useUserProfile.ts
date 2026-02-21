'use client';

import { useEffect } from 'react';
import { doc, runTransaction } from 'firebase/firestore';
import { useUser, useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import type { UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export function useUserProfile() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

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
            // Assume settings doc might not exist, though it should.
            const firstUserHasBeenCreated = settingsDoc.exists() && settingsDoc.data().firstUserCreated === true;

            let role: 'admin' | 'staff';
            let mustChangePassword: boolean;

            if (!firstUserHasBeenCreated) {
                // This is the first user.
                role = 'admin';
                mustChangePassword = true;
                // Update the settings to mark that the first user has been created.
                // It's crucial this write happens, protected by security rules.
                if (settingsDoc.exists()) {
                    transaction.update(settingsRef, { firstUserCreated: true });
                } else {
                    // This case is unlikely but handled for safety.
                    transaction.set(settingsRef, { firstUserCreated: true }, { merge: true });
                }
            } else {
                // A first user/admin already exists.
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
            
            // Create the new user profile document within the transaction.
            transaction.set(userProfileRef, newProfile);
            
            // Return details for toast message
            return { isFirstUser: !firstUserHasBeenCreated, role: role };

          }).then((result) => {
              if (result?.isFirstUser) {
                toast({
                    title: "Welcome, Administrator!",
                    description: "You have been assigned the admin role. You will be asked to change your password for security.",
                    duration: 8000,
                });
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
  }, [user, profile, isProfileLoading, userProfileRef, firestore, toast]);

  return {
    profile,
    isLoading: isUserLoading || isProfileLoading,
    error,
  };
}
