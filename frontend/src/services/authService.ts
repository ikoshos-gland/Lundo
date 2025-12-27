import api from './api';
import { LoginCredentials, RegisterData, AuthResponse, RefreshTokenRequest, User } from '@/types';
import { firebaseAuthService } from './firebaseAuthService';

export interface FirebaseAuthResponse {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  is_verified: boolean;
  firebase_uid: string | null;
}

export const authService = {
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  async authenticateWithFirebase(idToken: string): Promise<User> {
    const response = await api.post<FirebaseAuthResponse>('/auth/firebase', {
      id_token: idToken,
    });
    // Map Firebase response to User type
    return {
      id: response.data.id,
      email: response.data.email,
      full_name: response.data.full_name,
      created_at: new Date().toISOString(),
    };
  },

  async refresh(refreshToken: string): Promise<{ access_token: string; refresh_token: string }> {
    const response = await api.post<{ access_token: string; refresh_token: string }>(
      '/auth/refresh',
      { refresh_token: refreshToken } as RefreshTokenRequest
    );
    return response.data;
  },

  async logout(): Promise<void> {
    // Sign out from Firebase
    try {
      await firebaseAuthService.signOut();
    } catch (error) {
      console.error('Firebase sign out error:', error);
    }
    // Clear local storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('firebaseToken');
  },
};
