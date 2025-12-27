import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '@/services/authService';
import { firebaseAuthService } from '@/services/firebaseAuthService';
import { handleApiError } from '@/services/api';
import { User, LoginCredentials, RegisterData } from '@/types';
import { authReady } from '@/services/firebase';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Initialize auth state - wait for Firebase to restore session
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initAuth = async () => {
      try {
        // Wait for Firebase persistence to be ready
        await authReady;

        // Use onAuthStateChanged to wait for Firebase to restore auth state
        // This is the ONLY reliable way to check if user is logged in after refresh
        unsubscribe = firebaseAuthService.onAuthStateChanged(async (firebaseUser) => {
          if (firebaseUser) {
            // Firebase user exists - get fresh token and restore session
            const freshToken = await firebaseUser.getIdToken();
            localStorage.setItem('firebaseToken', freshToken);

            // Check if we have user data in localStorage
            const userStr = localStorage.getItem('user');
            if (userStr) {
              const user = JSON.parse(userStr);
              setState({
                user,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });
            } else {
              // User data not in localStorage - re-authenticate with backend
              try {
                const user = await authService.authenticateWithFirebase(freshToken);
                localStorage.setItem('user', JSON.stringify(user));
                setState({
                  user,
                  isAuthenticated: true,
                  isLoading: false,
                  error: null,
                });
              } catch (error) {
                console.error('Error re-authenticating with backend:', error);
                setState(prev => ({ ...prev, isLoading: false }));
              }
            }
          } else {
            // No Firebase user - check for legacy JWT tokens
            const token = localStorage.getItem('accessToken');
            const userStr = localStorage.getItem('user');

            if (token && userStr) {
              const user = JSON.parse(userStr);
              setState({
                user,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });
            } else {
              // No auth at all
              setState(prev => ({ ...prev, isLoading: false }));
            }
          }
        });
      } catch (error) {
        console.error('Error initializing auth:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initAuth();

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);


  const login = async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authService.login(credentials);

      // Store tokens and user in localStorage
      localStorage.setItem('accessToken', response.access_token);
      localStorage.setItem('refreshToken', response.refresh_token);
      localStorage.setItem('user', JSON.stringify(response.user));

      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const apiError = handleApiError(error);
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: apiError.message,
      });
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Sign in with Google popup and get ID token
      const idToken = await firebaseAuthService.signInWithGoogle();

      // Store Firebase token
      localStorage.setItem('firebaseToken', idToken);

      // Authenticate with backend
      const user = await authService.authenticateWithFirebase(idToken);

      // Store user in localStorage
      localStorage.setItem('user', JSON.stringify(user));

      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Google login error:', error);
      const message = error.code === 'auth/popup-closed-by-user'
        ? 'Sign in was cancelled'
        : error.response?.data?.detail || error.message || 'Google sign in failed';

      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: message,
      });
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authService.register(data);

      // Store tokens and user in localStorage
      localStorage.setItem('accessToken', response.access_token);
      localStorage.setItem('refreshToken', response.refresh_token);
      localStorage.setItem('user', JSON.stringify(response.user));

      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const apiError = handleApiError(error);
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: apiError.message,
      });
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  return (
    <AuthContext.Provider value={{ ...state, login, loginWithGoogle, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
