'use client';

import { useEffect } from 'react';
import { doc, collection, query, where, runTransaction } from 'firebase/firestore';
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
            // Re-check if profile exists inside transaction to prevent race conditions.
            const freshProfileDoc = await transaction.get(userProfileRef);
            if (freshProfileDoc.exists()) {
              return; // Profile was created by another process, abort.
            }

            const usersCollection = collection(firestore, 'users');
            const adminQuery = query(usersCollection, where('role', '==', 'admin'));
            // Read to see if any admins exist.
            const adminSnapshot = await transaction.get(adminQuery);

            const isFirstUser = adminSnapshot.empty;
            const role: 'admin' | 'staff' = isFirstUser ? 'admin' : 'staff';
            const mustChangePassword = isFirstUser; // Force password change for first user

            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || 'unknown',
              displayName: user.displayName || user.email?.split('@')[0] || 'New User',
              role: role,
              mustChangePassword: mustChangePassword,
            };
            
            // Create the new user profile document within the transaction.
            transaction.set(userProfileRef, newProfile);
            
            // Return the role so we can show a toast.
            return { isFirstUser, role };
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
