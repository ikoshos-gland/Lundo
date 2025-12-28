import api from './api';

// Types matching backend schemas
export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    full_name: string;
}

export interface TokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

export interface UserResponse {
    id: number;
    email: string;
    full_name: string;
    is_active: boolean;
    is_verified: boolean;
    firebase_uid: string | null;
}

export interface FirebaseAuthData {
    id_token: string;
}

// Auth API functions
export const authApi = {
    /**
     * Login with email and password
     */
    login: async (credentials: LoginCredentials): Promise<TokenResponse> => {
        const response = await api.post<TokenResponse>('/auth/login', credentials);
        return response.data;
    },

    /**
     * Register a new user
     */
    register: async (data: RegisterData): Promise<UserResponse> => {
        const response = await api.post<UserResponse>('/auth/register', data);
        return response.data;
    },

    /**
     * Refresh access token
     */
    refreshToken: async (refreshToken: string): Promise<TokenResponse> => {
        const response = await api.post<TokenResponse>('/auth/refresh', {
            refresh_token: refreshToken,
        });
        return response.data;
    },

    /**
     * Get current user info
     */
    getCurrentUser: async (): Promise<UserResponse> => {
        const response = await api.get<UserResponse>('/auth/me');
        return response.data;
    },

    /**
     * Authenticate with Firebase ID token
     */
    firebaseAuth: async (idToken: string): Promise<TokenResponse> => {
        const response = await api.post<TokenResponse>('/auth/firebase', {
            id_token: idToken,
        });
        return response.data;
    },
};

export default authApi;
