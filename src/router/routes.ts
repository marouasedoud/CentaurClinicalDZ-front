import type { RouteRecordRaw } from 'vue-router';
import { LoginView } from '../views/LoginView';
import { PatientsView } from '../views/PatientsView';

/**
 * Standard route definitions for authentication and clinical views.
 * Protected routes use `meta: { requiresAuth: true }`.
 */
export const defaultAuthRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/patients',
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: {
      guestOnly: true,
      title: 'Centaur Clinical - Connexion',
    },
  },
  {
    path: '/patients',
    name: 'Patients',
    component: PatientsView,
    meta: {
      requiresAuth: true,
      title: 'Centaur Clinical - Liste des Patients',
    },
  },
];
