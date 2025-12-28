import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, googleProvider } from '../../config/firebase';
import { authApi, UserResponse, LoginCredentials, RegisterData } from '../../api';

interface AuthContextType {
    user: UserResponse | null;
    firebaseUser: FirebaseUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<UserResponse | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing session on mount
    useEffect(() => {
        const initAuth = async () => {
            const accessToken = localStorage.getItem('access_token');

            if (accessToken) {
                try {
                    const userData = await authApi.getCurrentUser();
                    setUser(userData);
                } catch (error) {
                    // Token invalid, clear it
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                }
            }

            setIsLoading(false);
        };

        initAuth();
    }, []);

    // Listen for Firebase auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
            setFirebaseUser(fbUser);
        });

        return () => unsubscribe();
    }, []);

    const login = async (credentials: LoginCredentials) => {
        setIsLoading(true);
        try {
            const tokens = await authApi.login(credentials);
            localStorage.setItem('access_token', tokens.access_token);
            localStorage.setItem('refresh_token', tokens.refresh_token);

            const userData = await authApi.getCurrentUser();
            setUser(userData);
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (data: RegisterData) => {
        setIsLoading(true);
        try {
            await authApi.register(data);
            // Auto-login after registration
            await login({ email: data.email, password: data.password });
        } finally {
            setIsLoading(false);
        }
    };

    const loginWithGoogle = async () => {
        setIsLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await result.user.getIdToken();
            console.log('[Auth] Got Firebase ID token');

            // Send token to backend to create/link user and get JWT tokens
            const tokens = await authApi.firebaseAuth(idToken);
            console.log('[Auth] Received tokens from backend:', {
                hasAccessToken: !!tokens?.access_token,
                hasRefreshToken: !!tokens?.refresh_token,
                accessTokenLength: tokens?.access_token?.length,
            });

            localStorage.setItem('access_token', tokens.access_token);
            localStorage.setItem('refresh_token', tokens.refresh_token);

            // Verify tokens were stored
            const storedToken = localStorage.getItem('access_token');
            console.log('[Auth] Token stored in localStorage:', {
                stored: !!storedToken,
                length: storedToken?.length,
                first50: storedToken?.substring(0, 50),
            });

            // Fetch user data with the new token
            console.log('[Auth] Calling getCurrentUser...');
            const userData = await authApi.getCurrentUser();
            console.log('[Auth] Got user data:', userData);
            setUser(userData);
        } catch (error) {
            console.error('[Auth] Login error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            // Sign out from Firebase if using it
            if (firebaseUser) {
                await firebaseSignOut(auth);
            }

            // Clear local storage
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('firebase_user');

            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const value: AuthContextType = {
        user,
        firebaseUser,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        loginWithGoogle,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
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

export default AuthContext;
