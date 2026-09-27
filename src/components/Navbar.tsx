import { defineComponent } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useAuth } from '../auth/use-auth';

export const Navbar = defineComponent({
  name: 'Navbar',
  setup() {
    const { isAuthenticated, user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = async (): Promise<void> => {
      await logout();
      if (router) {
        router.push('/login');
      }
    };

    return () => (
      <header class="navbar">
        <div class="navbar-brand">
          <span>Centaur Clinical</span>
        </div>

        {isAuthenticated.value && (
          <nav class="navbar-menu" aria-label="Main menu">
            <RouterLink class="navbar-menu-link" to="/patients">Patients</RouterLink>
            <RouterLink class="navbar-menu-link" to="/patients/create">Create Patient</RouterLink>
          </nav>
        )}

        <div class="navbar-actions">
          {isAuthenticated.value && user.value ? (
            <>
              <div class="user-status-pill">
                <span class="status-dot" />
                <span id="nav-username">{user.value.username}</span>
              </div>
              <button
                id="nav-logout-btn"
                class="btn btn-danger-outline"
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
            </>
          ) : (
            <div class="user-status-pill">
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--text-muted)',
                }}
              />
              <span>Guest</span>
            </div>
          )}
        </div>
      </header>
    );
  },
});

export default Navbar;
