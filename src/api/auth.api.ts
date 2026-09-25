import type { AxiosInstance } from 'axios';
import { defaultApiClient } from './client';
import type {
  ApiResponse,
  LoginCredentials,
  LoginResponseData,
  MeResponseData,
} from '../types';

export class AuthApi {
  constructor(private readonly client: AxiosInstance = defaultApiClient) {}

  /**
   * Submits credentials to login endpoint and retrieves user profile + tokens.
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponseData>> {
    const response = await this.client.post<ApiResponse<LoginResponseData>>(
      '/api/auth/login',
      credentials
    );
    return response.data;
  }

  /**
   * Fetches authenticated user's profile from /api/auth/me.
   */
  async getMe(): Promise<ApiResponse<MeResponseData>> {
    const response = await this.client.get<ApiResponse<MeResponseData>>('/api/auth/me');
    return response.data;
  }

  /**
   * Refreshes access token using the stored refresh token.
   */
  async refreshToken(refreshToken: string): Promise<ApiResponse<LoginResponseData>> {
    const response = await this.client.post<ApiResponse<LoginResponseData>>(
      '/api/auth/refresh',
      { refreshToken }
    );
    return response.data;
  }

  /**
   * Logs out the user and revokes the refresh token on the server.
   */
  async logout(refreshToken: string): Promise<ApiResponse<null>> {
    const response = await this.client.post<ApiResponse<null>>('/api/auth/logout', {
      refreshToken,
    });
    return response.data;
  }
}

export const defaultAuthApi = new AuthApi();
