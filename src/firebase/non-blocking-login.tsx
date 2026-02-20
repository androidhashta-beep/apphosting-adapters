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
        `[Firebase Auth] Network Error during ${operation}: Cannot connect to the Firebase server.

        >>> TROUBLESHOOTING CHECKLIST <<<
        1. Is the server PC (IP: 10.30.0.250) turned on?
        2. Is the 'firebase emulators:start' command still running in PowerShell on the server?
        3. Are this device and the server on the same Wi-Fi network?
        4. Could a firewall on the server be blocking ports 8080, 9099, or 4000?

        This is a network configuration issue, not an application bug.`
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
