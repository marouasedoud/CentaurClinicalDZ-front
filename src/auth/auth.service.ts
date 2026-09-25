import { reactive, computed } from 'vue';
import type { AxiosError } from 'axios';
import type {
  AuthState,
  LoginCredentials,
  UserProfile,
  ApiResponse,
  LoginResponseData,
} from '../types';
import { TokenStorageService, defaultStorage } from './storage.service';
import { AuthApi, defaultAuthApi } from '../api/auth.api';

export class AuthService {
  private readonly state: AuthState;

  constructor(
    private readonly api: AuthApi = defaultAuthApi,
    private readonly storage: TokenStorageService = defaultStorage
  ) {
    const storedAccessToken = this.storage.getAccessToken();
    const storedRefreshToken = this.storage.getRefreshToken();
    const storedUser = this.storage.getUser();

    this.state = reactive<AuthState>({
      isAuthenticated: Boolean(storedAccessToken),
      user: storedUser,
      accessToken: storedAccessToken,
      refreshToken: storedRefreshToken,
      loading: false,
      error: null,
    });
  }

  // Reactive state getters
  public get isAuthenticated(): boolean {
    return this.state.isAuthenticated;
  }

  public get user(): UserProfile | null {
    return this.state.user;
  }

  public get accessToken(): string | null {
    return this.state.accessToken;
  }

  public get refreshToken(): string | null {
    return this.state.refreshToken;
  }

  public get loading(): boolean {
    return this.state.loading;
  }

  public get error(): string | null {
    return this.state.error;
  }

  public clearError(): void {
    this.state.error = null;
  }

  /**
   * Performs user login with credentials.
   */
  public async login(credentials: LoginCredentials): Promise<LoginResponseData> {
    this.state.loading = true;
    this.state.error = null;

    try {
      const response = await this.api.login(credentials);

      if (response.status === 'success' && response.data) {
        const { user, tokens } = response.data;

        // Persist tokens and profile
        this.storage.setTokens(tokens);
        this.storage.setUser(user);

        // Update reactive state
        this.state.isAuthenticated = true;
        this.state.user = user;
        this.state.accessToken = tokens.accessToken;
        this.state.refreshToken = tokens.refreshToken;
        this.state.error = null;

        return response.data;
      }

      throw new Error(response.message || 'Login failed');
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ApiResponse>;
      let message = 'An unexpected error occurred during login.';

      if (axiosError.response?.data?.message) {
        message = axiosError.response.data.message;
      } else if (axiosError.response?.data?.errors && axiosError.response.data.errors.length > 0) {
        message = axiosError.response.data.errors.map((e) => e.message).join(', ');
      } else if (err instanceof Error) {
        message = err.message;
      }

      this.state.error = message;
      throw new Error(message);
    } finally {
      this.state.loading = false;
    }
  }

  /**
   * Refreshes user profile by calling GET /api/auth/me.
   */
  public async fetchUserProfile(): Promise<UserProfile | null> {
    if (!this.storage.getAccessToken()) {
      return null;
    }

    try {
      const response = await this.api.getMe();
      if (response.status === 'success' && response.data) {
        this.state.user = response.data.user;
        this.storage.setUser(response.data.user);
        return response.data.user;
      }
      return null;
    } catch {
      // If /me fails due to invalid/expired token, invalidate state
      this.logoutLocal();
      return null;
    }
  }

  /**
   * Performs token refresh.
   */
  public async refreshTokens(): Promise<boolean> {
    const currentRefreshToken = this.storage.getRefreshToken();
    if (!currentRefreshToken) {
      this.logoutLocal();
      return false;
    }

    try {
      const response = await this.api.refreshToken(currentRefreshToken);
      if (response.status === 'success' && response.data) {
        const { tokens, user } = response.data;
        this.storage.setTokens(tokens);
        this.storage.setUser(user);
        this.state.accessToken = tokens.accessToken;
        this.state.refreshToken = tokens.refreshToken;
        this.state.user = user;
        this.state.isAuthenticated = true;
        return true;
      }
      this.logoutLocal();
      return false;
    } catch {
      this.logoutLocal();
      return false;
    }
  }

  /**
   * Clears state locally and in storage without API call.
   */
  public logoutLocal(): void {
    this.storage.clearAll();
    this.state.isAuthenticated = false;
    this.state.user = null;
    this.state.accessToken = null;
    this.state.refreshToken = null;
    this.state.error = null;
  }

  /**
   * Invalidates refresh token on server and clears local authentication state.
   */
  public async logout(): Promise<void> {
    this.state.loading = true;
    const currentRefreshToken = this.storage.getRefreshToken();

    try {
      if (currentRefreshToken) {
        await this.api.logout(currentRefreshToken);
      }
    } catch {
      // Even if API call fails, proceed with local logout
    } finally {
      this.logoutLocal();
      this.state.loading = false;
    }
  }
}

export const defaultAuthService = new AuthService();
