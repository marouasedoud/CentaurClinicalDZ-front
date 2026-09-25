import { createApp } from 'vue';
import { createCentaurAuth } from '../src';
import { router } from './router';
import { App } from './App';

/**
 * Example consumer application demonstrating how to initialize and consume
 * the Centaur Clinical Authentication Plugin.
 */
const app = createApp(App);

// Initialize Centaur Auth Plugin with backend URL and router instance
const auth = createCentaurAuth({
  apiUrl: process.env.VUE_APP_API_URL || 'http://localhost:5000',
  router,
  loginRoutePath: '/login',
  defaultRedirectPath: '/patients',
});

// Install Router
app.use(router);

// Install Centaur Auth Plugin (automatically sets up router guards & auth state)
app.use(auth);

// Mount Application
app.mount('#app');
