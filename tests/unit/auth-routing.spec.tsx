import { flushPromises } from '@vue/test-utils';
import { defaultPatientApi } from '../../src/api/patient.api';
import { createAuthContext, mountApplication, testUser } from './helpers';

const patientResponse = {
    status: 'success' as const,
    statusCode: 200,
    data: {
        service: 'general' as const,
        count: 1,
        patients: [{
            id: 'p-1',
            nom: 'Martin',
            prenom: 'Alice',
            date_hospitalisation: '2026-09-21T23:00:00.000Z',
            service: 'general' as const,
        }],
    },
};

afterEach(() => {
    jest.restoreAllMocks();
});

describe('login and protected patient routing', () => {
    it('logs in with valid credentials and redirects to Patients', async () => {
        const login = jest.fn().mockResolvedValue({
            status: 'success',
            statusCode: 200,
            data: { user: testUser, tokens: { accessToken: 'access-valid', refreshToken: 'refresh-valid' } },
        });
        const { auth } = createAuthContext({ login });
        jest.spyOn(defaultPatientApi, 'getPatientsByService').mockResolvedValue(patientResponse);
        const { router, wrapper } = await mountApplication(auth, '/login');

        await wrapper.get('#username-input').setValue('clinician');
        await wrapper.get('#password-input').setValue('correct-password');
        await wrapper.get('form').trigger('submit');
        await flushPromises();

        expect(login).toHaveBeenCalledWith({ username: 'clinician', password: 'correct-password' });
        expect(router.currentRoute.value.path).toBe('/patients');
        expect(wrapper.text()).toContain('Alice');
        expect(auth.isAuthenticated).toBe(true);
    });

    it('shows a login error and stays on Login for incorrect credentials', async () => {
        const { auth } = createAuthContext({
            login: jest.fn().mockRejectedValue(new Error('Invalid username or password')),
        });
        const { router, wrapper } = await mountApplication(auth, '/login');

        await wrapper.get('#username-input').setValue('wrong-user');
        await wrapper.get('#password-input').setValue('wrong-password');
        await wrapper.get('form').trigger('submit');
        await flushPromises();

        expect(router.currentRoute.value.path).toBe('/login');
        expect(wrapper.get('#login-error-alert').text()).toContain('Invalid username or password');
        expect(auth.isAuthenticated).toBe(false);
    });

    it('allows a stored authenticated user into Patients and renders patient data', async () => {
        const { auth } = createAuthContext({ accessToken: 'validated-access-token' });
        jest.spyOn(defaultPatientApi, 'getPatientsByService').mockResolvedValue(patientResponse);
        const { router, wrapper } = await mountApplication(auth, '/patients');
        await flushPromises();

        expect(router.currentRoute.value.path).toBe('/patients');
        expect(wrapper.text()).toContain('Liste des Patients');
        expect(wrapper.text()).toContain('Alice');
    });

    it('redirects when no token is present', async () => {
        const { auth } = createAuthContext();
        const { router, wrapper } = await mountApplication(auth, '/patients');

        expect(router.currentRoute.value.path).toBe('/login');
        expect(wrapper.find('#username-input').exists()).toBe(true);
    });

    it('protects the Create Patient page and preserves its redirect destination', async () => {
        const { auth } = createAuthContext();
        const { router, wrapper } = await mountApplication(auth, '/patients/create');

        expect(router.currentRoute.value.path).toBe('/login');
        expect(router.currentRoute.value.query.redirect).toBe('/patients/create');
        expect(wrapper.find('#username-input').exists()).toBe(true);
    });

    it.each(['invalid-token', 'expired-token'])('%s is cleared after a 401 and redirects to Login', async (token) => {
        const { auth, storage } = createAuthContext({ accessToken: token });
        const unauthorized = Object.assign(new Error('Unauthorized'), {
            response: { status: 401 },
        });
        jest.spyOn(defaultPatientApi, 'getPatientsByService').mockRejectedValue(unauthorized);
        const { router, wrapper } = await mountApplication(auth, '/patients');
        await flushPromises();

        expect(router.currentRoute.value.path).toBe('/login');
        expect(storage.getAccessToken()).toBeNull();
        expect(wrapper.find('#username-input').exists()).toBe(true);
    });

    it('logs out from Navbar, clears tokens, and redirects to Login', async () => {
        const { auth, api, storage } = createAuthContext({ accessToken: 'active-token' });
        jest.spyOn(defaultPatientApi, 'getPatientsByService').mockResolvedValue(patientResponse);
        const { router, wrapper } = await mountApplication(auth, '/patients');
        await flushPromises();

        await wrapper.get('#nav-logout-btn').trigger('click');
        await flushPromises();

        expect(api.logout).toHaveBeenCalledWith('refresh-token');
        expect(storage.getAccessToken()).toBeNull();
        expect(auth.isAuthenticated).toBe(false);
        expect(router.currentRoute.value.path).toBe('/login');
    });
});