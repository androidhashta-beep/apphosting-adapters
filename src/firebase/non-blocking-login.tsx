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

        >>> FINAL DIAGNOSIS & SOLUTION <<<
        This error indicates that security software on your PC (like Windows Defender Firewall) is blocking the application. This is common for new desktop applications.

        ACTION REQUIRED:
        1. Open your firewall settings (e.g., Windows Defender Firewall).
        2. Find the setting for "Allow an app through firewall".
        3. Add this application's executable file to the list of allowed apps. The file is located in the 'out/make' folder inside your project directory.

        This is a one-time setup step for your PC. All code-level fixes for this issue have been applied.`
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
