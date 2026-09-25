import { defineComponent, ref } from 'vue';
import type { PropType } from 'vue';
import { useAuth } from '../auth/use-auth';
import type { LoginResponseData } from '../types';

export const LoginForm = defineComponent({
  name: 'LoginForm',
  props: {
    onSuccess: {
      type: Function as PropType<(data: LoginResponseData) => void>,
      required: false,
    },
    title: {
      type: String,
      default: 'Sign In',
    },
    subtitle: {
      type: String,
      default: 'Access your Centaur Clinical workspace',
    },
  },
  emits: ['success', 'error'],
  setup(props, { emit }) {
    const { login, error: authError, clearError } = useAuth();

    const username = ref('');
    const password = ref('');
    const showPassword = ref(false);
    const localError = ref<string | null>(null);
    const loading = ref(false);

    const handleSubmit = async (e: Event): Promise<void> => {
      e.preventDefault();
      clearError();
      localError.value = null;

      const trimmedUsername = username.value.trim();
      const rawPassword = password.value;

      if (!trimmedUsername) {
        localError.value = 'Please enter your username';
        return;
      }

      if (!rawPassword) {
        localError.value = 'Please enter your password';
        return;
      }

      loading.value = true;

      try {
        const responseData = await login({
          username: trimmedUsername,
          password: rawPassword,
        });

        emit('success', responseData);
        if (props.onSuccess) {
          props.onSuccess(responseData);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Authentication failed';
        localError.value = message;
        emit('error', message);
      } finally {
        loading.value = false;
      }
    };

    const togglePasswordVisibility = (): void => {
      showPassword.value = !showPassword.value;
    };

    return () => {
      const activeError = localError.value || authError.value;

      return (
        <div class="auth-card">
          <div class="card-header">
            <div class="card-icon-wrapper">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                width="28"
                height="28"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <h1 class="card-title">{props.title}</h1>
            <p class="card-subtitle">{props.subtitle}</p>
          </div>

          {activeError && (
            <div class="alert alert-danger" role="alert" id="login-error-alert">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                width="18"
                height="18"
                style={{ flexShrink: 0, marginTop: '2px' }}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{activeError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} novalidate>
            <div class="form-group">
              <label class="form-label" for="username-input">
                Username
              </label>
              <div class="input-wrapper">
                <span class="input-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    width="18"
                    height="18"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  id="username-input"
                  type="text"
                  class="form-input"
                  placeholder="Enter your username"
                  value={username.value}
                  onInput={(e: Event) => {
                    username.value = (e.target as HTMLInputElement).value;
                  }}
                  autocomplete="username"
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="password-input">
                Password
              </label>
              <div class="input-wrapper">
                <span class="input-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    width="18"
                    height="18"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="password-input"
                  type={showPassword.value ? 'text' : 'password'}
                  class="form-input"
                  placeholder="Enter your password"
                  value={password.value}
                  onInput={(e: Event) => {
                    password.value = (e.target as HTMLInputElement).value;
                  }}
                  autocomplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                  }}
                  title={showPassword.value ? 'Hide password' : 'Show password'}
                >
                  {showPassword.value ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      width="18"
                      height="18"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      width="18"
                      height="18"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              id="submit-login-btn"
              type="submit"
              class="btn btn-primary"
              disabled={loading.value}
            >
              {loading.value ? (
                <>
                  <div class="spinner" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In to Centaur</span>
              )}
            </button>
          </form>
        </div>
      );
    };
  },
});

export default LoginForm;
