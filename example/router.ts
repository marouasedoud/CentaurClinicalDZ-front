import { createRouter, createWebHistory } from 'vue-router';
import { defaultAuthRoutes } from '../src';

/**
 * Vue Router instance for the example consumer application.
 * Utilizes HTML5 history mode and standard route definitions with navigation guards.
 */
export const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes: [
    ...defaultAuthRoutes,
    // Future consumer routes can be added here easily:
    // {
    //   path: '/dashboard',
    //   component: DashboardView,
    //   meta: { requiresAuth: true }
    // }
  ],
});

router.afterEach((to) => {
  if (to.meta.title && typeof to.meta.title === 'string') {
    document.title = to.meta.title;
  }
});

export default router;
