import type { RouteRecordRaw } from 'vue-router';
import { LoginView } from '../views/LoginView';
import { WelcomeView } from '../views/WelcomeView';

/**
 * Standard route definitions for authentication.
 * Other routes in the consumer application can simply add `meta: { requiresAuth: true }`.
 */
export const defaultAuthRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/welcome',
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: {
      guestOnly: true,
      title: 'Centaur Clinical - Login',
    },
  },
  {
    path: '/welcome',
    name: 'Welcome',
    component: WelcomeView,
    meta: {
      requiresAuth: true,
      title: 'Centaur Clinical - Welcome',
    },
  },
];
