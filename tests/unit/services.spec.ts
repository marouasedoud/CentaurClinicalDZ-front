import type { AxiosInstance } from 'axios';
import { AuthApi } from '../../src/api/auth.api';
import { PatientApi } from '../../src/api/patient.api';
import { AuthService } from '../../src/auth/auth.service';
import { TokenStorageService } from '../../src/auth/storage.service';

describe('API services', () => {
    it('requests patients from the service endpoint with query and bearer token', async () => {
        const response = {
            data: {
                status: 'success' as const,
                statusCode: 200,
                data: { service: 'urgence' as const, count: 0, patients: [] },
            },
        };
        const client = { get: jest.fn().mockResolvedValue(response) } as unknown as AxiosInstance;
        const api = new PatientApi(client);

        await expect(api.getPatientsByService('urgence', 'access-token')).resolves.toEqual(response.data);
        expect(client.get).toHaveBeenCalledWith('/api/patients', {
            params: { service: 'urgence' },
            headers: { Authorization: 'Bearer access-token' },
        });
    });

    it('posts login credentials to the auth endpoint', async () => {
        const response = { data: { status: 'success', statusCode: 200 } };
        const client = { post: jest.fn().mockResolvedValue(response) } as unknown as AxiosInstance;
        const api = new AuthApi(client);

        await expect(api.login({ username: 'clinician', password: 'secret' })).resolves.toBe(response.data);
        expect(client.post).toHaveBeenCalledWith('/api/auth/login', {
            username: 'clinician',
            password: 'secret',
        });
    });
});

describe('AuthService', () => {
    it('stores access and refresh tokens and updates authentication after login', async () => {
        const user = { id: 'user-1', username: 'clinician' };
        const loginResponse = {
            status: 'success' as const,
            statusCode: 200,
            data: {
                user,
                tokens: { accessToken: 'access-token', refreshToken: 'refresh-token' },
            },
        };
        const api = { login: jest.fn().mockResolvedValue(loginResponse) } as unknown as AuthApi;
        const storage = new TokenStorageService(`auth_service_test_${Date.now()}_`);
        const auth = new AuthService(api, storage);

        await auth.login({ username: 'clinician', password: 'secret' });

        expect(api.login).toHaveBeenCalledWith({ username: 'clinician', password: 'secret' });
        expect(storage.getAccessToken()).toBe('access-token');
        expect(storage.getRefreshToken()).toBe('refresh-token');
        expect(storage.getUser()).toEqual(user);
        expect(auth.isAuthenticated).toBe(true);
    });
});