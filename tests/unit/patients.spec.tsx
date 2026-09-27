import { createRouter, createMemoryHistory } from 'vue-router';
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent, nextTick } from 'vue';
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

async function mountPatientsView(additionalPatients: PatientRow[] = []) {
  const { auth } = createAuthContext({ accessToken: 'test-token' });
  const api = {
    getPatientsByService: jest.fn(async (service: PatientService) => ({
      status: 'success' as const,
      statusCode: 200,
      data: {
        service,
        count: 1 + additionalPatients.filter((patient) => patient.service === service).length,
        patients: [patientByService[service], ...additionalPatients.filter((patient) => patient.service === service)],
      } as GetPatientsResponseData,
    })),
    deletePatient: jest.fn(async () => undefined),
    updatePatient: jest.fn(async (id: string, updates: Partial<PatientRow>) => ({
      status: 'success' as const,
      statusCode: 200,
      data: { ...Object.values(patientByService).find((patient) => patient.id === id), ...updates } as PatientRow,
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
    ['general', 'Général', 'GénéralPrénom', '2026-09-21'],
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

  it('deletes the selected patient and displays success feedback', async () => {
    const { wrapper, api } = await mountPatientsView();
    const confirm = jest.spyOn(window, 'confirm').mockReturnValue(true);

    await wrapper.get('[aria-label="Supprimer GénéralPrénom GénéralNom"]').trigger('click');
    await flushPromises();

    expect(confirm).toHaveBeenCalledWith('Voulez-vous vraiment supprimer GénéralPrénom GénéralNom ?');
    expect(api.deletePatient).toHaveBeenCalledWith('general-1', 'test-token');
    expect(wrapper.find('.patient-row').exists()).toBe(false);
    expect(wrapper.get('[role="status"]').text()).toBe('Patient supprimé avec succès.');
    expect(wrapper.get('.patients-container').element.firstElementChild?.getAttribute('role')).toBe('status');

    confirm.mockRestore();
  });

  it('does not delete or change the patient when deletion is cancelled', async () => {
    const { wrapper, api } = await mountPatientsView();
    const confirm = jest.spyOn(window, 'confirm').mockReturnValue(false);

    await wrapper.get('[aria-label="Supprimer GénéralPrénom GénéralNom"]').trigger('click');
    await flushPromises();

    expect(confirm).toHaveBeenCalled();
    expect(api.deletePatient).not.toHaveBeenCalled();
    expect(wrapper.find('.patient-row').exists()).toBe(true);
    expect(wrapper.find('[role="status"]').exists()).toBe(false);
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);

    confirm.mockRestore();
  });

  it('keeps the patient and displays an error when deletion fails', async () => {
    const { wrapper, api } = await mountPatientsView();
    const confirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
    (api.deletePatient as jest.Mock).mockRejectedValue(new Error('Suppression impossible'));

    await wrapper.get('[aria-label="Supprimer GénéralPrénom GénéralNom"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('.patient-row').exists()).toBe(true);
    expect(wrapper.get('[role="alert"]').text()).toBe('Suppression impossible');

    confirm.mockRestore();
  });

  it.each(['success', 'error'] as const)('automatically dismisses %s deletion feedback after five seconds', async (result) => {
    const { wrapper, api } = await mountPatientsView();
    const confirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
    if (result === 'error') {
      (api.deletePatient as jest.Mock).mockRejectedValue(new Error('Suppression impossible'));
    }
    jest.useFakeTimers();

    await wrapper.get('[aria-label="Supprimer GénéralPrénom GénéralNom"]').trigger('click');
    await flushPromises();
    const feedbackSelector = result === 'success' ? '[role="status"]' : '[role="alert"]';
    expect(wrapper.find(feedbackSelector).exists()).toBe(true);

    jest.advanceTimersByTime(4999);
    await nextTick();
    expect(wrapper.find(feedbackSelector).exists()).toBe(true);

    jest.advanceTimersByTime(1);
    await nextTick();
    expect(wrapper.find(feedbackSelector).exists()).toBe(false);

    jest.useRealTimers();
    confirm.mockRestore();
  });

  it('edits only the selected row and pre-fills common fields with the correct input types', async () => {
    const secondGeneralPatient: PatientRow = {
      id: 'general-2', nom: 'SecondNom', prenom: 'SecondPrénom',
      date_hospitalisation: '2026-09-22', service: 'general',
    };
    const { wrapper } = await mountPatientsView([secondGeneralPatient]);

    await wrapper.get('[aria-label="Modifier GénéralPrénom GénéralNom"]').trigger('click');

    expect(wrapper.get('[aria-label="nom"]').element).toHaveProperty('value', 'GénéralNom');
    expect(wrapper.get('[aria-label="prenom"]').element).toHaveProperty('value', 'GénéralPrénom');
    expect((wrapper.get('[aria-label="date_hospitalisation"]').element as HTMLInputElement).type).toBe('date');
    expect(wrapper.findAll('.patient-edit-input')).toHaveLength(3);
    expect(wrapper.find('[aria-label="Modifier SecondPrénom SecondNom"]').exists()).toBe(true);
    expect(wrapper.findAll('.patient-row')).toHaveLength(2);
    expect(wrapper.find('[aria-label="Validate"]').exists()).toBe(true);
    expect(wrapper.find('[aria-label="Cancel"]').exists()).toBe(true);
  });

  it('uses the triage mapping in display and edit mode and only offers levels 1 through 5', async () => {
    const { wrapper } = await mountPatientsView();
    await wrapper.get('#tab-urgence').trigger('click');
    await flushPromises();

    expect(wrapper.get('.triage-badge').text()).toBe('Niveau 2 — Très urgent');
    expect(wrapper.get('.triage-badge').classes()).toContain('triage-2');
    await wrapper.get('[aria-label="Modifier UrgencePrénom UrgenceNom"]').trigger('click');

    expect((wrapper.get('[aria-label="heure_arrivee"]').element as HTMLInputElement).type).toBe('time');
    const triageSelect = wrapper.get('[aria-label="niveau_triage"]');
    expect(Array.from((triageSelect.element as HTMLSelectElement).options).map((option) => option.value)).toEqual(['', '1', '2', '3', '4', '5']);
    expect(triageSelect.classes()).toContain('triage-2');
    expect(wrapper.get('[aria-label="gravite_initiale"]').element).toHaveProperty('type', 'text');

    await triageSelect.setValue('5');
    expect(wrapper.get('[aria-label="niveau_triage"]').classes()).toContain('triage-5');
    await wrapper.get('[aria-label="Cancel"]').trigger('click');
    await wrapper.get('[aria-label="Modifier UrgencePrénom UrgenceNom"]').trigger('click');
    expect(wrapper.get('[aria-label="niveau_triage"]').classes()).toContain('triage-2');
  });

  it('uses the stage mapping in display and edit mode and only offers stages 1 through 4', async () => {
    const { wrapper } = await mountPatientsView();
    await wrapper.get('#tab-oncologie').trigger('click');
    await flushPromises();

    expect(wrapper.get('.stade-badge').text()).toBe('Stade II');
    expect(wrapper.get('.stade-badge').classes()).toContain('stade-2');
    await wrapper.get('[aria-label="Modifier OncoPrénom OncoNom"]').trigger('click');

    const stageSelect = wrapper.get('[aria-label="stade"]');
    expect(Array.from((stageSelect.element as HTMLSelectElement).options).map((option) => option.value)).toEqual(['', '1', '2', '3', '4']);
    expect(stageSelect.classes()).toContain('stade-2');
    expect(wrapper.get('[aria-label="type_tumeur"]').element).toHaveProperty('type', 'text');

    await stageSelect.setValue('4');
    expect(wrapper.get('[aria-label="stade"]').classes()).toContain('stade-4');
    await wrapper.get('[aria-label="Cancel"]').trigger('click');
    await wrapper.get('[aria-label="Modifier OncoPrénom OncoNom"]').trigger('click');
    expect(wrapper.get('[aria-label="stade"]').classes()).toContain('stade-2');
    await wrapper.get('[aria-label="Cancel"]').trigger('click');
    await wrapper.get('#tab-cardiologie').trigger('click');
    await flushPromises();
    await wrapper.get('[aria-label="Modifier CardioPrénom CardioNom"]').trigger('click');
    expect((wrapper.get('[aria-label="frequence_cardiaque_repos"]').element as HTMLInputElement).type).toBe('number');
    expect(wrapper.get('[aria-label="resultats_ecg"]').element).toHaveProperty('type', 'text');
  });

  it('cancels editing without PATCH and restores the original patient data', async () => {
    const { wrapper, api } = await mountPatientsView();
    await wrapper.get('[aria-label="Modifier GénéralPrénom GénéralNom"]').trigger('click');
    await wrapper.get('[aria-label="nom"]').setValue('Changed');
    await wrapper.get('[aria-label="Cancel"]').trigger('click');

    expect(api.updatePatient).not.toHaveBeenCalled();
    expect(wrapper.get('.patient-name-primary').text()).toBe('GénéralNom');
  });

  it('patches edited fields, updates the row, and displays success feedback', async () => {
    const { wrapper, api } = await mountPatientsView();
    await wrapper.get('[aria-label="Modifier GénéralPrénom GénéralNom"]').trigger('click');
    await wrapper.get('[aria-label="nom"]').setValue('NouveauNom');
    await wrapper.get('[aria-label="Validate"]').trigger('click');
    await flushPromises();

    expect(api.updatePatient).toHaveBeenCalledWith('general-1', expect.objectContaining({ nom: 'NouveauNom' }), 'test-token');
    expect(wrapper.find('.patient-edit-input').exists()).toBe(false);
    expect(wrapper.get('.patient-name-primary').text()).toBe('NouveauNom');
    expect(wrapper.get('[role="status"]').text()).toBe('Updated successfully');
  });

  it('keeps edit mode and shows an error when PATCH fails', async () => {
    const { wrapper, api } = await mountPatientsView();
    (api.updatePatient as jest.Mock).mockRejectedValue(new Error('Update rejected'));
    await wrapper.get('[aria-label="Modifier GénéralPrénom GénéralNom"]').trigger('click');
    await wrapper.get('[aria-label="nom"]').setValue('AttemptedName');
    await wrapper.get('[aria-label="Validate"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('.patient-edit-input').exists()).toBe(true);
    expect(wrapper.get('[aria-label="nom"]').element).toHaveProperty('value', 'AttemptedName');
    expect(wrapper.get('[role="alert"]').text()).toBe('Update rejected');
  });

  it.each(['success', 'error'] as const)('automatically dismisses %s update feedback after five seconds', async (result) => {
    const { wrapper, api } = await mountPatientsView();
    if (result === 'error') {
      (api.updatePatient as jest.Mock).mockRejectedValue(new Error('Update rejected'));
    }
    jest.useFakeTimers();
    await wrapper.get('[aria-label="Modifier GénéralPrénom GénéralNom"]').trigger('click');
    await wrapper.get('[aria-label="Validate"]').trigger('click');
    await flushPromises();
    const feedbackSelector = result === 'success' ? '[role="status"]' : '[role="alert"]';
    expect(wrapper.find(feedbackSelector).exists()).toBe(true);

    jest.advanceTimersByTime(4999);
    await nextTick();
    expect(wrapper.find(feedbackSelector).exists()).toBe(true);
    jest.advanceTimersByTime(1);
    await nextTick();
    expect(wrapper.find(feedbackSelector).exists()).toBe(false);
    jest.useRealTimers();
  });
});