import type { App } from 'vue';
import { AuthService } from '../auth/auth.service';
import { provideAuthService } from '../auth/use-auth';
import { setupAuthGuard } from '../router/guard';
import { createApiClient } from '../api/client';
import { AuthApi } from '../api/auth.api';
import { TokenStorageService } from '../auth/storage.service';
import type { CentaurAuthPluginOptions } from '../types';

/**
 * Centaur Clinical Authentication Plugin.
 * Bundles reactive state, token persistence, Axios interceptors,
 * and centralized Vue Router navigation guards into a standard Vue 3 plugin.
 */
export class CentaurAuth {
  public readonly authService: AuthService;
  public readonly storage: TokenStorageService;
  public readonly api: AuthApi;

  constructor(options: CentaurAuthPluginOptions = {}) {
    this.storage = new TokenStorageService(options.storageKeyPrefix || 'centaur_auth_');
    const apiClient = createApiClient(options.apiUrl, this.storage);
    this.api = new AuthApi(apiClient);
    this.authService = new AuthService(this.api, this.storage);

    if (options.router) {
      setupAuthGuard(options.router, {
        authService: this.authService,
        loginPath: options.loginRoutePath || '/login',
        defaultRedirectPath: options.defaultRedirectPath || '/patients',
      });
    }
  }

  public install(app: App): void {
    provideAuthService(this.authService, app);
    app.config.globalProperties.$auth = this.authService;
  }
}

export function createCentaurAuth(options: CentaurAuthPluginOptions = {}): CentaurAuth {
  return new CentaurAuth(options);
}
