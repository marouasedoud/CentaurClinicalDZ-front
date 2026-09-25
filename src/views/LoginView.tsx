import { defineComponent } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { LoginForm } from '../components/LoginForm';

export const LoginView = defineComponent({
  name: 'LoginView',
  setup() {
    const router = useRouter();
    const route = useRoute();

    const handleLoginSuccess = (): void => {
      const redirectTarget = (route.query.redirect as string) || '/patients';
      router.push(redirectTarget);
    };

    return () => (
      <div class="main-content">
        <LoginForm onSuccess={handleLoginSuccess} />
      </div>
    );
  },
});

export default LoginView;
