import { defineComponent, ref, onMounted } from 'vue';
import { PatientTable } from '../components/PatientTable';
import { PatientServiceTab } from '../components/PatientServiceTab';
import { usePatients } from '../composables/use-patients';
import { defaultPatientApi } from '../api/patient.api';
import type { PatientApi } from '../api/patient.api';
import type { PatientService } from '../types';

interface ServiceTab {
  id: PatientService;
  label: string;
}

export const PatientsView = defineComponent({
  name: 'PatientsView',
  props: {
    patientApi: {
      type: Object as () => PatientApi,
      default: () => defaultPatientApi,
    },
  },
  setup(props) {
    const tabs: ServiceTab[] = [
      { id: 'general', label: 'Général' },
      { id: 'urgence', label: 'Urgence' },
      { id: 'oncologie', label: 'Oncologie' },
      { id: 'cardiologie', label: 'Cardiologie' },
    ];

    const activeService = ref<PatientService>('general');
    const { patients, loading, error, fetchPatients } = usePatients(props.patientApi);

    const selectService = (service: PatientService): void => {
      activeService.value = service;
      void fetchPatients(service);
    };

    onMounted(() => {
      void fetchPatients('general');
    });

    return () => (
      <div class="main-content patients-page-layout">
        <div class="patients-container">
          {/* Header Banner */}
          <div class="patients-header-card">
            <div class="patients-header-top">
              <div class="patients-title-group">
                <h1 class="patients-main-title">Liste des Patients</h1>
              </div>

              <div class="patients-stats-card">
                <span class="stats-label">Patients chargés</span>
                <span class="stats-number" id="patients-count">
                  {loading.value ? '—' : patients.value.length}
                </span>
                <span class="stats-service">
                  Service : <strong style={{ color: 'var(--primary)', textTransform: 'capitalize' }}>{activeService.value}</strong>
                </span>
              </div>
            </div>

            {/* Error Banner */}
            {error.value && (
              <div class="alert alert-danger" style={{ marginTop: '16px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div style={{ flex: 1 }}>{error.value}</div>
                <button
                  type="button"
                  class="btn btn-outline"
                  style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                  onClick={() => fetchPatients(activeService.value)}
                >
                  Réessayer
                </button>
              </div>
            )}

            {/* Navigation Tabs */}
            <div class="tabs-wrapper">
              <div class="tabs-nav" role="tablist">
                {tabs.map((tab) => {
                  const isActive = activeService.value === tab.id;
                  return (
                    <PatientServiceTab
                      key={tab.id}
                      service={tab.id}
                      label={tab.label}
                      active={isActive}
                      count={patients.value.length}
                      loading={loading.value}
                      onSelect={selectService}
                    />
                  );
                })}
              </div>

              <div class="tabs-actions">
                <button
                  id="refresh-patients-btn"
                  class="btn btn-outline"
                  title="Actualiser la liste"
                  disabled={loading.value}
                  onClick={() => fetchPatients(activeService.value)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    width="16"
                    height="16"
                    class={loading.value ? 'spin-icon' : ''}
                  >
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                  <span>Actualiser</span>
                </button>
              </div>
            </div>
          </div>

          <PatientTable
            patients={patients.value}
            service={activeService.value}
            loading={loading.value}
          />
        </div>
      </div>
    );
  },
});

export default PatientsView;
