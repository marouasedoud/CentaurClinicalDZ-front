import { inject, provide, computed } from 'vue';
import type { App, InjectionKey, ComputedRef } from 'vue';
import { AuthService, defaultAuthService } from './auth.service';
import type { UserProfile } from '../types';

export const AUTH_SERVICE_KEY: InjectionKey<AuthService> = Symbol('CentaurAuthService');

export function provideAuthService(authService: AuthService, app?: App): void {
  if (app) {
    app.provide(AUTH_SERVICE_KEY, authService);
  } else {
    provide(AUTH_SERVICE_KEY, authService);
  }
}

export function useAuth(): {
  service: AuthService;
  isAuthenticated: ComputedRef<boolean>;
  user: ComputedRef<UserProfile | null>;
  accessToken: ComputedRef<string | null>;
  loading: ComputedRef<boolean>;
  error: ComputedRef<string | null>;
  login: AuthService['login'];
  logout: AuthService['logout'];
  refreshTokens: AuthService['refreshTokens'];
  fetchUserProfile: AuthService['fetchUserProfile'];
  clearError: AuthService['clearError'];
} {
  const service = inject(AUTH_SERVICE_KEY, defaultAuthService);

  return {
    service,
    isAuthenticated: computed(() => service.isAuthenticated),
    user: computed(() => service.user),
    accessToken: computed(() => service.accessToken),
    loading: computed(() => service.loading),
    error: computed(() => service.error),
    login: service.login.bind(service),
    logout: service.logout.bind(service),
    refreshTokens: service.refreshTokens.bind(service),
    fetchUserProfile: service.fetchUserProfile.bind(service),
    clearError: service.clearError.bind(service),
  };
}
