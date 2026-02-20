'use client';
import {
  Auth, // Import Auth type for type hinting
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { toast } from '@/hooks/use-toast';

const handleAuthError = (error: any, operation: string) => {
    if (error.code === 'auth/network-request-failed') {
      toast({
            variant: "destructive",
            title: "CRITICAL: Connection Blocked by Firewall",
            description: `The '${operation}' operation failed because your PC's firewall is blocking the connection to the local database. Please allow the app through your firewall to continue.`,
            duration: 20000,
        });
    } else {
      console.warn(`[Firebase Auth] Error during ${operation}:`, error);
    }
}


/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance)
    .catch(error => handleAuthError(error, 'anonymous sign-in'));
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  createUserWithEmailAndPassword(authInstance, email, password)
    .catch(error => handleAuthError(error, 'email sign-up'));
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  signInWithEmailAndPassword(authInstance, email, password)
    .catch(error => handleAuthError(error, 'email sign-in'));
}
