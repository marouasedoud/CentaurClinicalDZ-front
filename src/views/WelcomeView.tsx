import { defineComponent, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../auth/use-auth';

export const WelcomeView = defineComponent({
  name: 'WelcomeView',
  setup() {
    const { user, accessToken, logout, fetchUserProfile, refreshTokens } = useAuth();
    const router = useRouter();

    const showFullToken = ref(false);
    const actionMessage = ref<{ text: string; type: 'success' | 'error' } | null>(null);
    const isActionRunning = ref(false);

    const handleLogout = async (): Promise<void> => {
      await logout();
      router.push('/login');
    };

    const handleVerifySession = async (): Promise<void> => {
      isActionRunning.value = true;
      actionMessage.value = null;
      try {
        const profile = await fetchUserProfile();
        if (profile) {
          actionMessage.value = {
            text: `Successfully verified with backend /api/auth/me for "${profile.username}"!`,
            type: 'success',
          };
        } else {
          actionMessage.value = {
            text: 'Session expired or invalid.',
            type: 'error',
          };
          router.push('/login');
        }
      } catch (err: unknown) {
        actionMessage.value = {
          text: err instanceof Error ? err.message : 'Verification failed',
          type: 'error',
        };
      } finally {
        isActionRunning.value = false;
      }
    };

    const handleRefreshToken = async (): Promise<void> => {
      isActionRunning.value = true;
      actionMessage.value = null;
      try {
        const success = await refreshTokens();
        if (success) {
          actionMessage.value = {
            text: 'Tokens rotated and refreshed successfully via backend!',
            type: 'success',
          };
        } else {
          actionMessage.value = {
            text: 'Refresh token expired or revoked. Please login again.',
            type: 'error',
          };
          router.push('/login');
        }
      } catch (err: unknown) {
        actionMessage.value = {
          text: err instanceof Error ? err.message : 'Failed to refresh tokens',
          type: 'error',
        };
      } finally {
        isActionRunning.value = false;
      }
    };

    return () => {
      const currentUser = user.value;
      const currentToken = accessToken.value || '';
      const displayToken =
        showFullToken.value || currentToken.length < 24
          ? currentToken
          : `${currentToken.slice(0, 16)}••••••••${currentToken.slice(-12)}`;

      return (
        <div class="main-content">
          <div class="welcome-container">
            <div class="welcome-hero">
              <div class="welcome-hero-content">
                <div class="welcome-badge">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    width="14"
                    height="14"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>Authenticated Session</span>
                </div>

                <h1 class="welcome-title">
                  Welcome back, <span>{currentUser?.username || 'User'}</span>!
                </h1>

                <p class="welcome-desc">
                  You have successfully logged in to the Centaur Clinical workspace.
                  This page is protected by centralized Vue Router navigation guards.
                </p>

                {actionMessage.value && (
                  <div
                    class={`alert alert-${actionMessage.value.type === 'success' ? 'success' : 'danger'}`}
                  >
                    <span>{actionMessage.value.text}</span>
                  </div>
                )}

                <div class="meta-grid">
                  <div class="meta-item">
                    <div class="meta-item-label">User ID</div>
                    <div class="meta-item-value meta-item-mono">
                      {currentUser?.id || 'N/A'}
                    </div>
                  </div>

                  <div class="meta-item">
                    <div class="meta-item-label">Username</div>
                    <div class="meta-item-value" id="welcome-username">
                      {currentUser?.username || 'N/A'}
                    </div>
                  </div>

                  <div class="meta-item">
                    <div class="meta-item-label">Account Created</div>
                    <div class="meta-item-value">
                      {currentUser?.created_at
                        ? new Date(currentUser.created_at).toLocaleString()
                        : 'Active'}
                    </div>
                  </div>

                  <div class="meta-item">
                    <div class="meta-item-label">Route Guard Status</div>
                    <div class="meta-item-value" style={{ color: 'var(--success)' }}>
                      ✓ Protected (meta.requiresAuth)
                    </div>
                  </div>
                </div>

                <div class="token-viewer">
                  <div class="token-viewer-header">
                    <span>Active JWT Access Token</span>
                    <button
                      type="button"
                      class="btn btn-outline"
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      onClick={() => {
                        showFullToken.value = !showFullToken.value;
                      }}
                    >
                      {showFullToken.value ? 'Mask Token' : 'Show Full Token'}
                    </button>
                  </div>
                  <div class="token-code">{displayToken}</div>
                </div>

                <div class="quick-actions">
                  <button
                    id="verify-session-btn"
                    class="btn btn-outline"
                    disabled={isActionRunning.value}
                    onClick={handleVerifySession}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      width="16"
                      height="16"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span>Test Protected /me Call</span>
                  </button>

                  <button
                    id="refresh-token-btn"
                    class="btn btn-outline"
                    disabled={isActionRunning.value}
                    onClick={handleRefreshToken}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      width="16"
                      height="16"
                    >
                      <polyline points="23 4 23 10 17 10" />
                      <polyline points="1 20 1 14 7 14" />
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                    <span>Rotate Token (/refresh)</span>
                  </button>

                  <button
                    id="logout-btn"
                    class="btn btn-danger-outline"
                    disabled={isActionRunning.value}
                    onClick={handleLogout}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      width="16"
                      height="16"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    };
  },
});

export default WelcomeView;
