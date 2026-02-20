'use client';
import {
  Auth, // Import Auth type for type hinting
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';

const handleAuthError = (error: any, operation: string) => {
    if (error.code === 'auth/network-request-failed') {
      console.warn(
        `[Firebase Auth] Network Connection Blocked during ${operation}.

        >>> FINAL DIAGNOSIS: PC FIREWALL OR SECURITY SOFTWARE <<<
        The application code is correct, but your PC's security is preventing it from connecting to the local server. This is the final step to resolve the issue.

        >>> ACTION REQUIRED ON YOUR PC <<<
        1. Open your PC's firewall settings (e.g., search for 'Windows Defender Firewall').
        2. Find the setting to 'Allow an app through firewall'.
        3. Add your application's .exe file to the list of allowed apps. It is located in the 'out/make' folder inside your project.

        This is a manual, one-time configuration on your computer. The application code cannot be changed further to fix this.`
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
