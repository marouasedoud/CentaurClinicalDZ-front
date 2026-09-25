import type { Router } from 'vue-router';

/**
 * Authenticated user profile information returned from the backend.
 */
export interface UserProfile {
  id: string;
  username: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Access and refresh token pair issued by backend JWT service.
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * User login request payload.
 */
export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * Standard backend API response envelope.
 */
export interface ApiResponse<T = unknown> {
  status: 'success' | 'fail' | 'error';
  statusCode: number;
  message?: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}

/**
 * Payload returned on successful login.
 */
export interface LoginResponseData {
  user: UserProfile;
  tokens: AuthTokens;
}

/**
 * Payload returned by /me endpoint.
 */
export interface MeResponseData {
  user: UserProfile;
}

/**
 * Reactive frontend authentication state.
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Configuration options for the Centaur Auth Plugin.
 */
export interface CentaurAuthPluginOptions {
  apiUrl?: string;
  storageKeyPrefix?: string;
  loginRoutePath?: string;
  defaultRedirectPath?: string;
  router?: Router;
}
