'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Chrome, AlertTriangle, Loader2, ArrowLeft } from 'lucide-react';
import { signInWithGoogle } from '@/lib/firebase/auth';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage, logError } from '@/lib/errors';
import Link from 'next/link';

export default function LoginPage() {
  const { user, loading, error: authError, isConfigured } = useAuth();
  const router = useRouter();
  const { error: showError } = useToast();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    if (!isConfigured) {
      showError('Firebase is not configured. Please check your environment settings.');
      return;
    }

    setIsSigningIn(true);
    setSignInError(null);

    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (error) {
      logError(error, { context: 'handleGoogleSignIn' });
      const message = getErrorMessage(error);
      setSignInError(message);
      showError(message);
    } finally {
      setIsSigningIn(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Configuration error state
  if (!isConfigured || authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Configuration Error
            </h1>
            <p className="text-gray-600 mb-6">
              {authError?.message || 'Firebase is not properly configured. Please ensure all environment variables are set correctly.'}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Reload Page
              </button>
              <Link 
                href="/"
                className="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        {/* Back to home link */}
        <Link 
          href="/" 
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" aria-hidden="true" />
          Back to home
        </Link>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg 
              className="w-8 h-8 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" 
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Voice Task Tracker
          </h1>
          <p className="text-gray-600">
            Manage your tasks with voice commands
          </p>
        </div>

        {/* Error message display */}
        {signInError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-sm text-red-800 font-medium">Sign-in failed</p>
                <p className="text-sm text-red-600 mt-1">{signInError}</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={isSigningIn}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          aria-busy={isSigningIn}
        >
          {isSigningIn ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              Signing in...
            </>
          ) : (
            <>
              <Chrome className="w-5 h-5" aria-hidden="true" />
              Continue with Google
            </>
          )}
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
          By signing in, you agree to our{' '}
          <a href="#" className="text-indigo-600 hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-indigo-600 hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
