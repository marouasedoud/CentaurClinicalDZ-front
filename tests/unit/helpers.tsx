import { defineComponent } from 'vue';
import { createRouter, createMemoryHistory, RouterView } from 'vue-router';
import { mount } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { AuthService } from '../../src/auth/auth.service';
import { AUTH_SERVICE_KEY } from '../../src/auth/use-auth';
import { TokenStorageService } from '../../src/auth/storage.service';
import { Navbar } from '../../src/components/Navbar';
import { defaultAuthRoutes } from '../../src/router/routes';
import { setupAuthGuard } from '../../src/router/guard';
import type { AuthApi } from '../../src/api/auth.api';

export const testUser = {
    id: 'user-1',
    username: 'clinician',
};

let storageInstance = 0;

export function createAuthContext(options: {
    accessToken?: string;
    login?: AuthApi['login'];
    logout?: AuthApi['logout'];
} = {}) {
    const storage = new TokenStorageService(`jest_auth_${++storageInstance}_`);
    if (options.accessToken) {
        storage.setTokens({ accessToken: options.accessToken, refreshToken: 'refresh-token' });
        storage.setUser(testUser);
    }

    const api = {
        login: jest.fn(options.login || (async () => { throw new Error('Login failed'); })),
        logout: jest.fn(options.logout || (async () => ({ status: 'success' as const, statusCode: 200, data: null }))),
        getMe: jest.fn(),
        refreshToken: jest.fn(),
    } as unknown as AuthApi;

    return { auth: new AuthService(api, storage), api, storage };
}

const TestApp = defineComponent({
    name: 'TestApp',
    setup() {
        return () => (
            <div>
                <Navbar />
                <RouterView />
            </div>
        );
    },
});

export async function mountApplication(
    auth: AuthService,
    initialPath: string
): Promise<{
    router: ReturnType<typeof createRouter>;
    wrapper: VueWrapper;
}> {
    const router = createRouter({
        history: createMemoryHistory(),
        routes: defaultAuthRoutes,
    });
    setupAuthGuard(router, { authService: auth });
    await router.push(initialPath);
    await router.isReady();

    const wrapper = mount(TestApp, {
        global: {
            plugins: [router],
            provide: { [AUTH_SERVICE_KEY as symbol]: auth },
        },
    });

    return { router, wrapper };
}