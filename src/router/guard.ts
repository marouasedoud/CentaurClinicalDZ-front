import type { NavigationGuardNext, RouteLocationNormalized, Router } from 'vue-router';
import { AuthService, defaultAuthService } from '../auth/auth.service';

export interface AuthGuardOptions {
  authService?: AuthService;
  loginPath?: string;
  defaultRedirectPath?: string;
}

/**
 * Creates a centralized Vue Router navigation guard.
 * Supports:
 * - meta.requiresAuth: Requires an active authentication token. If unauthenticated, redirects to loginPath.
 * - meta.guestOnly: For public-only pages like /login. If already authenticated, redirects to defaultRedirectPath.
 */
export function createAuthGuard(options: AuthGuardOptions = {}) {
  const authService = options.authService || defaultAuthService;
  const loginPath = options.loginPath || '/login';
  const defaultRedirectPath = options.defaultRedirectPath || '/welcome';

  return (
    to: RouteLocationNormalized,
    _from: RouteLocationNormalized,
    next: NavigationGuardNext
  ): void => {
    const isAuthenticated = authService.isAuthenticated;
    const requiresAuth = Boolean(to.matched.some((record) => record.meta.requiresAuth));
    const isGuestOnly = Boolean(to.matched.some((record) => record.meta.guestOnly));

    // Protected Route Protection
    if (requiresAuth && !isAuthenticated) {
      next({
        path: loginPath,
        query: to.fullPath !== loginPath ? { redirect: to.fullPath } : undefined,
      });
      return;
    }

    // Guest Only Route Protection (e.g. preventing authenticated user from hitting /login)
    if (isGuestOnly && isAuthenticated) {
      next({
        path: defaultRedirectPath,
      });
      return;
    }

    // Allow navigation
    next();
  };
}

/**
 * Helper to install the navigation guard onto a Vue Router instance.
 */
export function setupAuthGuard(router: Router, options: AuthGuardOptions = {}): void {
  router.beforeEach(createAuthGuard(options));
}
