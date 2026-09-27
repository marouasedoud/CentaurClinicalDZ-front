import { createRouter, createMemoryHistory, RouterView } from 'vue-router';
import { defineComponent } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { CreatePatientView } from '../../src/views/CreatePatientView';
import { Navbar } from '../../src/components/Navbar';
import { AUTH_SERVICE_KEY } from '../../src/auth/use-auth';
import type { PatientApi } from '../../src/api/patient.api';
import type { PatientRow, PatientService } from '../../src/types';
import { createAuthContext } from './helpers';

const createdPatient: PatientRow = {
    id: 'created-1',
    nom: 'Patient',
    prenom: 'Test',
    date_hospitalisation: '2026-09-27',
    service: 'general',
};

const TestApp = defineComponent({
    setup() {
        return () => (
            <div>
                <Navbar />
                <RouterView />
            </div>
        );
    },
});

async function mountCreatePatient() {
    const { auth } = createAuthContext({ accessToken: 'create-token' });
    const api = {
        createPatient: jest.fn(async () => ({
            status: 'success' as const,
            statusCode: 201,
            data: createdPatient,
        })),
    } as unknown as PatientApi;
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: '/patients', component: defineComponent({ render: () => <div>Patient list</div> }) },
            { path: '/patients/create', component: CreatePatientView, props: { patientApi: api } },
        ],
    });
    await router.push('/patients/create');
    await router.isReady();

    const wrapper = mount(TestApp, {
        global: {
            plugins: [router],
            provide: { [AUTH_SERVICE_KEY as symbol]: auth },
            stubs: { RouterLink: false },
        },
    });
    await flushPromises();
    return { wrapper, router, api };
}

async function chooseService(wrapper: ReturnType<typeof mount>, service: PatientService) {
    await wrapper.get('#create-service').setValue(service);
}

async function fillCommonFields(wrapper: ReturnType<typeof mount>) {
    await wrapper.get('[name="nom"]').setValue('Patient Nom');
    await wrapper.get('[name="prenom"]').setValue('Patient Prénom');
    await wrapper.get('[name="date_hospitalisation"]').setValue('2026-09-27');
}

afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
});

describe('CreatePatientView', () => {
    it('is accessible from the authenticated main menu and initially asks for a service', async () => {
        const { wrapper } = await mountCreatePatient();

        expect(wrapper.get('a[href="/patients/create"]').text()).toBe('Create Patient');
        expect(wrapper.find('[name="nom"]').exists()).toBe(false);
        expect(wrapper.find('[name="prenom"]').exists()).toBe(false);
        expect(wrapper.get('#create-service').element).toHaveProperty('required', true);
    });

    it.each([
        ['general', ['nom', 'prenom', 'date_hospitalisation']],
        ['urgence', ['nom', 'prenom', 'date_hospitalisation', 'heure_arrivee', 'niveau_triage', 'gravite_initiale']],
        ['oncologie', ['nom', 'prenom', 'date_hospitalisation', 'type_tumeur', 'stade', 'traitement_en_cours']],
        ['cardiologie', ['nom', 'prenom', 'date_hospitalisation', 'resultats_ecg', 'frequence_cardiaque_repos', 'tension_arterielle']],
    ] as const)('%s selection displays only its fields with the correct types', async (service, fields) => {
        const { wrapper } = await mountCreatePatient();

        await chooseService(wrapper, service);

        expect(wrapper.findAll('.create-patient-fields input, .create-patient-fields select').map((field) => field.attributes('name')).sort())
            .toEqual([...fields].sort());
        expect((wrapper.get('[name="date_hospitalisation"]').element as HTMLInputElement).type).toBe('date');
        if (service === 'urgence') {
            expect((wrapper.get('[name="heure_arrivee"]').element as HTMLInputElement).type).toBe('time');
            expect(wrapper.get('[name="niveau_triage"]').element.tagName).toBe('SELECT');
        }
        if (service === 'oncologie') {
            expect(wrapper.get('[name="stade"]').element.tagName).toBe('SELECT');
        }
        if (service === 'cardiologie') {
            const heartRate = wrapper.get('[name="frequence_cardiaque_repos"]');
            expect((heartRate.element as HTMLInputElement).type).toBe('number');
            expect(heartRate.attributes('min')).toBe('1');
            expect(heartRate.attributes('step')).toBe('1');
        }
    });

    it('uses the shared triage and stage options and updates selected colors immediately', async () => {
        const { wrapper } = await mountCreatePatient();
        await chooseService(wrapper, 'urgence');
        const triage = wrapper.get('[name="niveau_triage"]');
        expect(Array.from((triage.element as HTMLSelectElement).options).map((option) => option.value))
            .toEqual(['', '1', '2', '3', '4', '5']);
        await triage.setValue('4');
        expect(wrapper.get('[name="niveau_triage"]').classes()).toContain('triage-4');
        expect(wrapper.get('[name="niveau_triage"]').text()).toContain('Niveau 4 — Moins urgent');

        await chooseService(wrapper, 'oncologie');
        const stage = wrapper.get('[name="stade"]');
        expect(Array.from((stage.element as HTMLSelectElement).options).map((option) => option.value))
            .toEqual(['', '1', '2', '3', '4']);
        await stage.setValue('2');
        expect(wrapper.get('[name="stade"]').classes()).toContain('stade-2');
        expect(wrapper.get('[name="stade"]').text()).toContain('Stade II');
    });

    it.each([
        {
            service: 'general' as const,
            serviceFields: {},
        },
        {
            service: 'urgence' as const,
            serviceFields: { heure_arrivee: '09:30', niveau_triage: '2', gravite_initiale: 'Élevée' },
        },
        {
            service: 'oncologie' as const,
            serviceFields: { type_tumeur: 'Tumeur test', stade: '3', traitement_en_cours: 'Traitement test' },
        },
        {
            service: 'cardiologie' as const,
            serviceFields: { resultats_ecg: 'Normal', frequence_cardiaque_repos: '72', tension_arterielle: '120/80' },
        },
    ])('submits a typed %s patient payload with the access token', async ({ service, serviceFields }) => {
        const { wrapper, api } = await mountCreatePatient();
        await chooseService(wrapper, service);
        await fillCommonFields(wrapper);
        for (const [field, value] of Object.entries(serviceFields)) {
            await wrapper.get(`[name="${field}"]`).setValue(value);
        }
        await wrapper.get('form').trigger('submit');
        await flushPromises();

        const expectedPayload = {
            service,
            nom: 'Patient Nom',
            prenom: 'Patient Prénom',
            date_hospitalisation: '2026-09-27',
            ...(serviceFields.heure_arrivee && {
                heure_arrivee: '09:30', niveau_triage: 2, gravite_initiale: 'Élevée',
            }),
            ...(serviceFields.type_tumeur && {
                type_tumeur: 'Tumeur test', stade: 3, traitement_en_cours: 'Traitement test',
            }),
            ...(serviceFields.resultats_ecg && {
                resultats_ecg: 'Normal', frequence_cardiaque_repos: 72, tension_arterielle: '120/80',
            }),
        };
        expect(api.createPatient).toHaveBeenCalledWith(expectedPayload, 'create-token');
    });

    it('does not send invalid data and shows a validation error', async () => {
        const { wrapper, api } = await mountCreatePatient();
        await chooseService(wrapper, 'general');
        await wrapper.get('[name="nom"]').setValue('N'.repeat(101));
        await wrapper.get('[name="prenom"]').setValue('Patient');
        await wrapper.get('[name="date_hospitalisation"]').setValue('2026-02-30');
        await wrapper.get('form').trigger('submit');

        expect(api.createPatient).not.toHaveBeenCalled();
        expect(wrapper.get('[role="alert"]').text()).toContain('valid values');
    });

    it('cancels back to the patient list without making an API request', async () => {
        const { wrapper, router, api } = await mountCreatePatient();
        await chooseService(wrapper, 'general');
        await fillCommonFields(wrapper);

        await wrapper.get('button[type="button"]').trigger('click');
        await flushPromises();

        expect(api.createPatient).not.toHaveBeenCalled();
        expect(router.currentRoute.value.path).toBe('/patients');
    });

    it('shows success after a 201 response and resets the form', async () => {
        const { wrapper, api } = await mountCreatePatient();
        await chooseService(wrapper, 'general');
        await fillCommonFields(wrapper);
        await wrapper.get('form').trigger('submit');
        await flushPromises();

        expect(api.createPatient).toHaveBeenCalledTimes(1);
        expect(wrapper.get('[role="status"]').text()).toBe('Patient created successfully.');
        expect((wrapper.get('#create-service').element as HTMLSelectElement).value).toBe('');
        expect(wrapper.find('[name="nom"]').exists()).toBe(false);
    });

    it.each([
        [400, 'Invalid patient fields'],
        [401, 'Session expired or not authorized.'],
    ])('shows an appropriate message for API status %i', async (status, message) => {
        const { wrapper, api } = await mountCreatePatient();
        (api.createPatient as jest.Mock).mockRejectedValue(Object.assign(new Error('Request failed'), {
            response: { status, data: status === 400 ? { message: 'Invalid patient fields' } : {} },
        }));
        await chooseService(wrapper, 'general');
        await fillCommonFields(wrapper);
        await wrapper.get('form').trigger('submit');
        await flushPromises();

        expect(wrapper.get('[role="alert"]').text()).toBe(message);
    });

    it.each(['success', 'error'] as const)('dismisses the create %s message after five seconds', async (result) => {
        const { wrapper, api } = await mountCreatePatient();
        if (result === 'error') {
            (api.createPatient as jest.Mock).mockRejectedValue(Object.assign(new Error('Request failed'), {
                response: { status: 400, data: { message: 'Invalid patient fields' } },
            }));
        }
        jest.useFakeTimers();
        await chooseService(wrapper, 'general');
        await fillCommonFields(wrapper);
        await wrapper.get('form').trigger('submit');
        await flushPromises();
        const selector = result === 'success' ? '[role="status"]' : '[role="alert"]';
        expect(wrapper.find(selector).exists()).toBe(true);

        jest.advanceTimersByTime(4999);
        expect(wrapper.find(selector).exists()).toBe(true);
        jest.advanceTimersByTime(1);
        await flushPromises();
        expect(wrapper.find(selector).exists()).toBe(false);
    });
});