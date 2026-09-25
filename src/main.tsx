import { createApp } from 'vue';
import { createCentaurAuth } from './index';
import { router } from '../example/router';
import { App } from '../example/App';

const app = createApp(App);

const auth = createCentaurAuth({
  apiUrl: process.env.VUE_APP_API_URL || 'http://localhost:5000',
  router,
  loginRoutePath: '/login',
  defaultRedirectPath: '/welcome',
});

app.use(router);
app.use(auth);

app.mount('#app');
