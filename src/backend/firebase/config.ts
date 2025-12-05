import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';
import { firebaseConfig, isFirebaseConfigured } from '@/backend/env';
import { ConfigurationError, logError } from '@/backend/errors';

// Firebase instances
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let isInitialized = false;
let initializationError: Error | undefined;

/**
 * Initialize Firebase services
 * Called once on app startup
 */
function initializeFirebase(): void {
  // Skip if already initialized or on server without config
  if (isInitialized || initializationError) {
    return;
  }

  // Check if we're in the browser
  if (typeof window === 'undefined') {
    return;
  }

  // Validate configuration
  if (!isFirebaseConfigured) {
    initializationError = new ConfigurationError(
      'Firebase configuration is missing. Please check your environment variables.'
    );
    logError(initializationError, { config: 'missing' });
    return;
  }

  try {
    // Initialize Firebase app
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }

    // Initialize Auth
    auth = getAuth(app);

    // Initialize Firestore
    db = getFirestore(app);

    // Initialize Storage
    storage = getStorage(app);

    // Connect to emulators in development (if configured)
    if (process.env.NODE_ENV === 'development') {
      const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';
      if (useEmulator) {
        try {
          connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
          connectFirestoreEmulator(db, 'localhost', 8080);
          connectStorageEmulator(storage, 'localhost', 9199);
          console.log('🔧 Connected to Firebase emulators');
        } catch {
          // Emulators might already be connected
        }
      }
    }

    isInitialized = true;
    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    initializationError = error instanceof Error ? error : new Error(String(error));
    logError(error, { context: 'Firebase initialization' });
  }
}

// Initialize on import (client-side only)
if (typeof window !== 'undefined') {
  initializeFirebase();
}

/**
 * Get Firebase Auth instance
 * @throws ConfigurationError if Firebase is not properly configured
 */
export function getFirebaseAuth(): Auth {
  if (initializationError) {
    throw initializationError;
  }
  if (!auth) {
    throw new ConfigurationError('Firebase Auth is not initialized');
  }
  return auth;
}

/**
 * Get Firestore instance
 * @throws ConfigurationError if Firebase is not properly configured
 */
export function getFirebaseDb(): Firestore {
  if (initializationError) {
    throw initializationError;
  }
  if (!db) {
    throw new ConfigurationError('Firestore is not initialized');
  }
  return db;
}

/**
 * Check if Firebase is ready to use
 */
export function isFirebaseReady(): boolean {
  return isInitialized && !initializationError && !!auth && !!db && !!storage;
}

/**
 * Get Firebase Storage instance
 * @throws ConfigurationError if Firebase is not properly configured
 */
export function getFirebaseStorage(): FirebaseStorage {
  if (initializationError) {
    throw initializationError;
  }
  if (!storage) {
    throw new ConfigurationError('Firebase Storage is not initialized');
  }
  return storage;
}

/**
 * Get initialization error if any
 */
export function getInitializationError(): Error | undefined {
  return initializationError;
}

// Export instances (may be undefined before initialization)
export { app, auth, db, storage };
