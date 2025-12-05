'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, isFirebaseReady, getInitializationError } from '@/backend/firebase/config';
import { handleRedirectResult } from '@/backend/firebase/auth';
import { logError } from '@/backend/errors';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  isConfigured: boolean;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true,
  error: null,
  isConfigured: false,
  refreshAuth: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  // Check for configuration errors
  useEffect(() => {
    const configError = getInitializationError();
    if (configError) {
      setError(configError);
      setLoading(false);
      return;
    }

    setIsConfigured(isFirebaseReady());
  }, []);

  // Handle redirect result on mount
  useEffect(() => {
    if (!isConfigured) return;

    handleRedirectResult()
      .then((user) => {
        if (user) {
          setUser(user);
        }
      })
      .catch((error) => {
        logError(error, { context: 'handleRedirectResult' });
      });
  }, [isConfigured]);

  // Subscribe to auth state changes
  useEffect(() => {
    if (!auth || !isConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth, 
      (user) => {
        setUser(user);
        setLoading(false);
        setError(null);
      },
      (error) => {
        logError(error, { context: 'onAuthStateChanged' });
        setError(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isConfigured]);

  const refreshAuth = useCallback(async () => {
    if (!user) return;
    
    try {
      await user.reload();
      setUser({ ...user });
    } catch (error) {
      logError(error, { context: 'refreshAuth' });
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, error, isConfigured, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
