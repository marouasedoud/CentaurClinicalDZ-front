import { createRouter, createMemoryHistory } from 'vue-router';
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { PatientsView } from '../../src/views/PatientsView';
import { AUTH_SERVICE_KEY } from '../../src/auth/use-auth';
import type { PatientApi } from '../../src/api/patient.api';
import type { GetPatientsResponseData, PatientRow, PatientService } from '../../src/types';
import { createAuthContext } from './helpers';

const patientByService: Record<PatientService, PatientRow> = {
  general: {
    id: 'general-1', nom: 'GénéralNom', prenom: 'GénéralPrénom',
    date_hospitalisation: '2026-09-21', service: 'general',
  },
  urgence: {
    id: 'urgence-1', nom: 'UrgenceNom', prenom: 'UrgencePrénom',
    date_hospitalisation: '2026-09-20', service: 'urgence',
    heure_arrivee: '08:15', niveau_triage: 2, gravite_initiale: 'Élevée',
  },
  oncologie: {
    id: 'onco-1', nom: 'OncoNom', prenom: 'OncoPrénom',
    date_hospitalisation: '2026-09-19', service: 'oncologie',
    type_tumeur: 'Tumeur test', stade: 'II', traitement_en_cours: 'Traitement test',
  },
  cardiologie: {
    id: 'cardio-1', nom: 'CardioNom', prenom: 'CardioPrénom',
    date_hospitalisation: '2026-09-18', service: 'cardiologie',
    resultats_ecg: 'ECG test', frequence_cardiaque_repos: 72, tension_arterielle: '120/80',
  },
};

async function mountPatientsView() {
  const { auth } = createAuthContext({ accessToken: 'test-token' });
  const api = {
    getPatientsByService: jest.fn(async (service: PatientService) => ({
      status: 'success' as const,
      statusCode: 200,
      data: {
        service,
        count: 1,
        patients: [patientByService[service]],
      } as GetPatientsResponseData,
    })),
  } as unknown as PatientApi;
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/patients', component: PatientsView }],
  });
  await router.push('/patients');
  await router.isReady();

  const wrapper = mount(PatientsView, {
    props: { patientApi: api },
    global: {
      plugins: [router],
      provide: { [AUTH_SERVICE_KEY as symbol]: auth },
    },
  });

  await flushPromises();
  return { wrapper, api };
}

describe('PatientsView service tabs', () => {
  it.each([
    ['general', 'Général', 'GénéralPrénom', 'Médecine Générale'],
    ['urgence', 'Urgence', 'UrgencePrénom', '08:15'],
    ['oncologie', 'Oncologie', 'OncoPrénom', 'Tumeur test'],
    ['cardiologie', 'Cardiologie', 'CardioPrénom', 'ECG test'],
  ] as const)('%s tab selects the service and renders its patient data', async (service, label, patientName, serviceData) => {
    const { wrapper, api } = await mountPatientsView();

    await wrapper.get(`#tab-${service}`).trigger('click');
    await flushPromises();

    expect(wrapper.get(`#tab-${service}`).attributes('aria-selected')).toBe('true');
    expect(wrapper.get('.patients-table').text()).toContain(patientName);
    expect(wrapper.get('.patients-table').text()).toContain(serviceData);
    expect(api.getPatientsByService).toHaveBeenLastCalledWith(service, 'test-token');
    expect(wrapper.get(`#tab-${service}`).text()).toContain(label);
  });
});