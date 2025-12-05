/**
 * Custom error classes for the application
 */

export class AppError extends Error {
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;

  constructor(message: string, code: string, isOperational = true) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.isOperational = isOperational;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class AuthError extends AppError {
  constructor(message: string, code: string = 'AUTH_ERROR') {
    super(message, code);
    this.name = 'AuthError';
  }
}

export class FirestoreError extends AppError {
  constructor(message: string, code: string = 'FIRESTORE_ERROR') {
    super(message, code);
    this.name = 'FirestoreError';
  }
}

export class VoiceError extends AppError {
  constructor(message: string, code: string = 'VOICE_ERROR') {
    super(message, code);
    this.name = 'VoiceError';
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string) {
    super(message, 'CONFIG_ERROR', false);
    this.name = 'ConfigurationError';
  }
}

// Error code mappings for user-friendly messages
export const ERROR_MESSAGES: Record<string, string> = {
  // Auth errors
  'auth/user-not-found': 'No account found with this email address.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled.',
  'auth/weak-password': 'Please choose a stronger password.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled. Please try again.',
  'auth/popup-blocked': 'Pop-up was blocked. Please allow pop-ups and try again.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/invalid-api-key': 'Invalid Firebase configuration. Please contact support.',
  
  // Firestore errors
  'permission-denied': 'You do not have permission to perform this action.',
  'not-found': 'The requested resource was not found.',
  'already-exists': 'This resource already exists.',
  'resource-exhausted': 'Too many requests. Please try again later.',
  'failed-precondition': 'Operation failed. Please refresh and try again.',
  'aborted': 'Operation was aborted. Please try again.',
  'unavailable': 'Service temporarily unavailable. Please try again later.',
  
  // Voice errors
  'not-allowed': 'Microphone access denied. Please enable microphone permissions.',
  'no-speech': 'No speech was detected. Please try again.',
  'audio-capture': 'No microphone was found. Please connect a microphone.',
  'network': 'Network error during voice recognition.',
  'voice-aborted': 'Voice recognition was aborted.',
  'language-not-supported': 'The selected language is not supported.',
  
  // Generic
  'unknown': 'An unexpected error occurred. Please try again.',
  'offline': 'You appear to be offline. Please check your connection.',
};

/**
 * Get user-friendly error message from error code
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    // Check for Firebase error codes
    const firebaseError = error as { code?: string };
    if (firebaseError.code && ERROR_MESSAGES[firebaseError.code]) {
      return ERROR_MESSAGES[firebaseError.code];
    }
    return error.message;
  }

  if (typeof error === 'string') {
    return ERROR_MESSAGES[error] || error;
  }

  return ERROR_MESSAGES['unknown'];
}

/**
 * Log error for monitoring (in production, send to error tracking service)
 */
export function logError(error: unknown, context?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    code: error instanceof AppError ? error.code : undefined,
    context,
  };

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error]', errorInfo);
  }

  // TODO: In production, send to error tracking service (Sentry, LogRocket, etc.)
  // Example: Sentry.captureException(error, { extra: context });
}
