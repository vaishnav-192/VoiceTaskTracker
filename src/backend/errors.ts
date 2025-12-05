/**
 * Custom error classes for the application
 * Production-ready error handling with proper categorization and logging
 */

// Error severity levels for monitoring
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export class AppError extends Error {
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;
  public readonly severity: ErrorSeverity;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string, 
    code: string, 
    isOperational = true,
    severity: ErrorSeverity = 'medium',
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.isOperational = isOperational;
    this.timestamp = new Date();
    this.severity = severity;
    this.context = context;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class AuthError extends AppError {
  constructor(message: string, code: string = 'AUTH_ERROR', severity: ErrorSeverity = 'medium') {
    super(message, code, true, severity);
    this.name = 'AuthError';
  }
}

export class FirestoreError extends AppError {
  constructor(message: string, code: string = 'FIRESTORE_ERROR', severity: ErrorSeverity = 'high') {
    super(message, code, true, severity);
    this.name = 'FirestoreError';
  }
}

export class StorageError extends AppError {
  constructor(message: string, code: string = 'STORAGE_ERROR', severity: ErrorSeverity = 'medium') {
    super(message, code, true, severity);
    this.name = 'StorageError';
  }
}

export class VoiceError extends AppError {
  constructor(message: string, code: string = 'VOICE_ERROR', severity: ErrorSeverity = 'low') {
    super(message, code, true, severity);
    this.name = 'VoiceError';
  }
}

export class ValidationError extends AppError {
  public readonly field?: string;
  
  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR', true, 'low');
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network error. Please check your connection.') {
    super(message, 'NETWORK_ERROR', true, 'medium');
    this.name = 'NetworkError';
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string) {
    super(message, 'CONFIG_ERROR', false, 'critical');
    this.name = 'ConfigurationError';
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfter?: number;
  
  constructor(message: string = 'Too many requests. Please try again later.', retryAfter?: number) {
    super(message, 'RATE_LIMIT_ERROR', true, 'low');
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
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
  'auth/invalid-credential': 'Invalid credentials. Please try again.',
  'auth/account-exists-with-different-credential': 'An account already exists with a different sign-in method.',
  'auth/requires-recent-login': 'Please sign in again to complete this action.',
  'auth/credential-already-in-use': 'This credential is already associated with another account.',
  
  // Firestore errors
  'permission-denied': 'You do not have permission to perform this action.',
  'not-found': 'The requested resource was not found.',
  'already-exists': 'This resource already exists.',
  'resource-exhausted': 'Too many requests. Please try again later.',
  'failed-precondition': 'Operation failed. Please refresh and try again.',
  'aborted': 'Operation was aborted. Please try again.',
  'unavailable': 'Service temporarily unavailable. Please try again later.',
  'deadline-exceeded': 'Request timed out. Please try again.',
  'cancelled': 'Operation was cancelled.',
  'data-loss': 'Unrecoverable data loss or corruption.',
  'unauthenticated': 'You must be signed in to perform this action.',
  'internal': 'An internal error occurred. Please try again.',
  
  // Storage errors
  'storage/unauthorized': 'You do not have permission to upload files.',
  'storage/canceled': 'Upload was cancelled.',
  'storage/unknown': 'An unknown error occurred during upload.',
  'storage/object-not-found': 'File not found.',
  'storage/bucket-not-found': 'Storage bucket not found.',
  'storage/quota-exceeded': 'Storage quota exceeded.',
  'storage/invalid-checksum': 'File upload failed. Please try again.',
  'storage/retry-limit-exceeded': 'Upload failed after multiple attempts.',
  
  // Voice errors
  'not-allowed': 'Microphone access denied. Please enable microphone permissions.',
  'no-speech': 'No speech was detected. Please try again.',
  'audio-capture': 'No microphone was found. Please connect a microphone.',
  'network': 'Network error during voice recognition.',
  'voice-aborted': 'Voice recognition was aborted.',
  'language-not-supported': 'The selected language is not supported.',
  'service-not-allowed': 'Speech recognition service is not available.',
  
  // Validation errors
  'validation/title-required': 'Task title is required.',
  'validation/title-too-long': 'Task title is too long (max 500 characters).',
  'validation/title-empty': 'Task title cannot be empty.',
  'validation/user-required': 'User authentication is required.',
  'validation/id-required': 'Item ID is required.',
  'validation/invalid-status': 'Invalid task status.',
  'validation/invalid-priority': 'Invalid task priority.',
  'validation/invalid-date': 'Invalid date format.',
  
  // Generic
  'unknown': 'An unexpected error occurred. Please try again.',
  'offline': 'You appear to be offline. Please check your connection.',
  'timeout': 'Request timed out. Please try again.',
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
    const firebaseError = error as { code?: string; message?: string };
    if (firebaseError.code) {
      const friendlyMessage = ERROR_MESSAGES[firebaseError.code];
      if (friendlyMessage) {
        return friendlyMessage;
      }
    }
    
    // Don't expose internal error messages in production
    if (process.env.NODE_ENV === 'production') {
      // Check for common patterns
      if (error.message.includes('network') || error.message.includes('Network')) {
        return ERROR_MESSAGES['offline'];
      }
      if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        return ERROR_MESSAGES['timeout'];
      }
      // Return generic message for unknown errors in production
      return ERROR_MESSAGES['unknown'];
    }
    
    return error.message;
  }

  if (typeof error === 'string') {
    return ERROR_MESSAGES[error] || error;
  }

  return ERROR_MESSAGES['unknown'];
}

/**
 * Get error code from an error
 */
export function getErrorCode(error: unknown): string {
  if (error instanceof AppError) {
    return error.code;
  }
  
  if (error && typeof error === 'object' && 'code' in error) {
    return String((error as { code: unknown }).code);
  }
  
  return 'unknown';
}

/**
 * Check if an error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  const code = getErrorCode(error);
  const networkCodes = [
    'auth/network-request-failed',
    'unavailable',
    'network',
    'NETWORK_ERROR',
    'offline'
  ];
  
  if (networkCodes.includes(code)) return true;
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('network') || 
           message.includes('offline') || 
           message.includes('internet') ||
           message.includes('connection');
  }
  
  return false;
}

/**
 * Check if an error is a rate limit error
 */
export function isRateLimitError(error: unknown): boolean {
  const code = getErrorCode(error);
  return code === 'auth/too-many-requests' || 
         code === 'resource-exhausted' ||
         code === 'RATE_LIMIT_ERROR';
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (isNetworkError(error)) return true;
  
  const code = getErrorCode(error);
  const retryableCodes = [
    'unavailable',
    'deadline-exceeded',
    'aborted',
    'internal',
    'timeout'
  ];
  
  return retryableCodes.includes(code);
}

/**
 * Check if an error requires re-authentication
 */
export function requiresReauth(error: unknown): boolean {
  const code = getErrorCode(error);
  return code === 'auth/requires-recent-login' || 
         code === 'unauthenticated' ||
         code === 'permission-denied';
}

interface ErrorLogContext {
  context?: string;
  userId?: string;
  component?: string;
  action?: string;
  [key: string]: unknown;
}

/**
 * Log error for monitoring (in production, send to error tracking service)
 */
export function logError(error: unknown, context?: ErrorLogContext): void {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    code: getErrorCode(error),
    severity: error instanceof AppError ? error.severity : 'medium',
    isOperational: error instanceof AppError ? error.isOperational : true,
    context,
  };

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error]', errorInfo);
  } else {
    // Production: Only log non-operational errors or high/critical severity
    if (!errorInfo.isOperational || 
        errorInfo.severity === 'high' || 
        errorInfo.severity === 'critical') {
      console.error('[Production Error]', {
        timestamp: errorInfo.timestamp,
        code: errorInfo.code,
        severity: errorInfo.severity,
        context: errorInfo.context,
      });
    }
  }

  // TODO: In production, send to error tracking service (Sentry, LogRocket, etc.)
  // Example: 
  // if (process.env.NODE_ENV === 'production') {
  //   Sentry.captureException(error, { 
  //     extra: context,
  //     level: errorInfo.severity === 'critical' ? 'fatal' : errorInfo.severity
  //   });
  // }
}

/**
 * Async error wrapper with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delayMs?: number;
    backoff?: boolean;
    onRetry?: (attempt: number, error: unknown) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 3, delayMs = 1000, backoff = true, onRetry } = options;
  
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry non-retryable errors
      if (!isRetryableError(error)) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        onRetry?.(attempt, error);
        const delay = backoff ? delayMs * Math.pow(2, attempt - 1) : delayMs;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Assert condition with custom error
 */
export function assert(condition: unknown, message: string, ErrorClass = AppError): asserts condition {
  if (!condition) {
    throw new ErrorClass(message, 'ASSERTION_FAILED');
  }
}
