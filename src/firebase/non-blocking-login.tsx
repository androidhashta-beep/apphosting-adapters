'use client';
import {
  Auth, // Import Auth type for type hinting
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';

const handleAuthError = (error: any, operation: string) => {
    if (error.code === 'auth/network-request-failed') {
      console.error(
        `[Firebase Auth] Network Error during ${operation}: Cannot connect to the local Firebase Emulator.

        >>> TROUBLESHOOTING CHECKLIST <<<
        1. Is this the same PC where the emulators are running? If not, update 'localhost' in src/firebase/index.ts to the server's IP address.
        2. Is the 'firebase emulators:start' command still running in a PowerShell window? It should show "All emulators ready".
        3. Could a firewall or antivirus on this PC be blocking the application from accessing localhost (127.0.0.1) on ports 9099 (Auth) or 8080 (Firestore)?

        This is a local network configuration issue, not an application bug.`
      );
    } else {
      console.error(`[Firebase Auth] Error during ${operation}:`, error);
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
