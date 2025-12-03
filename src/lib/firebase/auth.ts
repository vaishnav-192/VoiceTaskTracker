import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  User,
  browserPopupRedirectResolver,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { getFirebaseAuth, isFirebaseReady } from './config';
import { AuthError, getErrorMessage, logError } from '@/lib/errors';

const googleProvider = new GoogleAuthProvider();

// Add scopes for better user data
googleProvider.addScope('profile');
googleProvider.addScope('email');

// Set custom parameters
googleProvider.setCustomParameters({
  prompt: 'select_account' // Always show account selector
});

/**
 * Sign in with Google using popup
 * Falls back to redirect on mobile or if popup is blocked
 */
export async function signInWithGoogle(): Promise<User> {
  if (!isFirebaseReady()) {
    throw new AuthError(
      'Authentication service is not available. Please refresh the page.',
      'auth/not-initialized'
    );
  }

  const auth = getFirebaseAuth();

  try {
    // Try popup first (works better on desktop)
    const result = await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
    return result.user;
  } catch (error) {
    const firebaseError = error as { code?: string };
    
    // If popup was blocked, try redirect
    if (firebaseError.code === 'auth/popup-blocked' || 
        firebaseError.code === 'auth/popup-closed-by-user') {
      console.log('Popup blocked, trying redirect...');
      await signInWithRedirect(auth, googleProvider);
      // This won't return - page will redirect
      throw new AuthError('Redirecting to Google sign-in...', 'auth/redirect');
    }

    // Log and re-throw with user-friendly message
    logError(error, { context: 'signInWithGoogle' });
    throw new AuthError(getErrorMessage(error), firebaseError.code || 'auth/unknown');
  }
}

/**
 * Handle redirect result after Google sign-in redirect
 * Call this on app initialization
 */
export async function handleRedirectResult(): Promise<User | null> {
  if (!isFirebaseReady()) {
    return null;
  }

  const auth = getFirebaseAuth();

  try {
    const result = await getRedirectResult(auth);
    return result?.user || null;
  } catch (error) {
    logError(error, { context: 'handleRedirectResult' });
    return null;
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  if (!isFirebaseReady()) {
    throw new AuthError(
      'Authentication service is not available.',
      'auth/not-initialized'
    );
  }

  const auth = getFirebaseAuth();

  try {
    await firebaseSignOut(auth);
  } catch (error) {
    logError(error, { context: 'signOut' });
    throw new AuthError(getErrorMessage(error), 'auth/sign-out-failed');
  }
}

/**
 * Get the current authenticated user
 */
export function getCurrentUser(): User | null {
  if (!isFirebaseReady()) {
    return null;
  }

  const auth = getFirebaseAuth();
  return auth.currentUser;
}
