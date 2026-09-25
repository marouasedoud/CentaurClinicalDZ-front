# Centaur Clinical Auth — Integration Example

This directory contains a complete example demonstrating how to consume and use the **Centaur Clinical Authentication Plugin** in any Vue 3 + TypeScript application.

---

## 1. How to Consume the Plugin

In your application's entry file (`main.ts` or `main.tsx`):

```typescript
import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import { createCentaurAuth, defaultAuthRoutes } from '../src';
import App from './App';

const app = createApp(App);

// 1. Create your Vue Router instance
const router = createRouter({
  history: createWebHistory(),
  routes: [
    ...defaultAuthRoutes, // Includes /login and /welcome
    {
      path: '/dashboard',
      component: () => import('./views/DashboardView'),
      meta: { requiresAuth: true }, // Protect any page with requiresAuth: true
    },
  ],
});

// 2. Instantiate CentaurAuth with your backend API URL and router instance
const auth = createCentaurAuth({
  apiUrl: process.env.VUE_APP_API_URL || 'http://localhost:5000',
  router, // Enables automatic navigation guard protection
  loginRoutePath: '/login',
  defaultRedirectPath: '/welcome',
});

// 3. Register plugins
app.use(router);
app.use(auth);

// 4. Mount
app.mount('#app');
```

---

## 2. Using Authentication in JSX / TSX Components

You can access reactive auth state and actions anywhere with the `useAuth()` hook:

```tsx
import { defineComponent } from 'vue';
import { useAuth } from '../src';

export default defineComponent({
  name: 'UserProfileCard',
  setup() {
    const { user, isAuthenticated, logout } = useAuth();

    return () => (
      <div>
        {isAuthenticated.value ? (
          <div>
            <h3>Hello, {user.value?.username}!</h3>
            <button onClick={() => logout()}>Logout</button>
          </div>
        ) : (
          <p>Please log in to continue.</p>
        )}
      </div>
    );
  },
});
```

---

## 3. Centralized Route Protection

Route protection is managed automatically by the navigation guard:
- `meta: { requiresAuth: true }` — Access denied if not authenticated; redirects to `/login` while preserving the intended URL in query parameter `?redirect=...`.
- `meta: { guestOnly: true }` — Access restricted to unauthenticated guests. If already logged in, automatically redirects to `/welcome`.

---

## 4. Running the Example Application

```bash
# In CentaurClinicalDZ-front:
npm run serve
```
Open `http://localhost:8080` in your browser.
