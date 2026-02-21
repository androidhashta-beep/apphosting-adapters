'use client';
import { Auth, signInAnonymously, User } from 'firebase/auth';

/**
 * Ensures the user is signed in anonymously.
 * If a user is already signed in, it does nothing.
 * If no user is signed in, it attempts to sign in anonymously.
 * @param authInstance The Firebase Auth instance.
 * @returns A promise that resolves when sign-in is complete or if a user is already present.
 */
export async function ensureAnonymousSignIn(authInstance: Auth): Promise<User | null> {
  if (authInstance.currentUser) {
    return authInstance.currentUser;
  }
  
  try {
    const userCredential = await signInAnonymously(authInstance);
    return userCredential.user;
  } catch (error) {
    console.error("Anonymous sign-in failed", error);
    // Depending on the app's requirements, you might want to handle this more gracefully.
    // For now, we re-throw to indicate a critical failure in initialization.
    throw new Error("Failed to authenticate the session.");
  }
}
