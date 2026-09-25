import { defineComponent, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../auth/use-auth';
import { defaultPatientApi, PatientApi } from '../api/patient.api';
import type {
  PatientService,
  PatientRow,
  UrgencePatient,
  OncologiePatient,
  CardiologiePatient,
} from '../types';

interface ServiceTab {
  id: PatientService;
  label: string;
  icon: string;
  badge?: string;
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
    const { user, accessToken, isAuthenticated, logout } = useAuth();
    const router = useRouter();

    const tabs: ServiceTab[] = [
      { id: 'general', label: 'Général', icon: 'stethoscope' },
      { id: 'urgence', label: 'Urgence', icon: 'alert' },
      { id: 'oncologie', label: 'Oncologie', icon: 'ribbon' },
      { id: 'cardiologie', label: 'Cardiologie', icon: 'heart' },
    ];

    const activeService = ref<PatientService>('general');
    const patients = ref<PatientRow[]>([]);
    const loading = ref<boolean>(false);
    const error = ref<string | null>(null);

    // Fetch patients for the selected service
    const fetchPatients = async (service: PatientService): Promise<void> => {
      loading.value = true;
      error.value = null;
      activeService.value = service;

      try {
        // Access token is automatically attached by Axios client interceptor,
        // and also explicitly passed for additional safety.
        const res = await props.patientApi.getPatientsByService(
          service,
          accessToken.value || undefined
        );

        if (res && res.data && Array.isArray(res.data.patients)) {
          patients.value = res.data.patients;
        } else {
          patients.value = [];
        }
      } catch (err: any) {
        if (err?.response?.status === 401) {
          error.value = 'Session expirée ou non autorisée. Veuillez vous reconnecter.';
          await logout();
          router.push('/login');
        } else {
          error.value =
            err?.response?.data?.message ||
            err?.message ||
            'Erreur lors du chargement des patients.';
        }
        patients.value = [];
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      fetchPatients('general');
    });

    const formatDate = (dateStr: string): string => {
      if (!dateStr) return '—';
      return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    };

    const getTriageBadge = (level?: number) => {
      switch (level) {
        case 1:
          return <span class="triage-badge triage-1">Niveau 1 — Réanimation</span>;
        case 2:
          return <span class="triage-badge triage-2">Niveau 2 — Très urgent</span>;
        case 3:
          return <span class="triage-badge triage-3">Niveau 3 — Urgent</span>;
        case 4:
          return <span class="triage-badge triage-4">Niveau 4 — Moins urgent</span>;
        case 5:
          return <span class="triage-badge triage-5">Niveau 5 — Non urgent</span>;
        default:
          return <span class="triage-badge triage-5">{level ? `Niveau ${level}` : 'N/A'}</span>;
      }
    };

    const renderTabIcon = (icon: string) => {
      switch (icon) {
        case 'stethoscope':
          return (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <path d="M4.5 3v5a4.5 4.5 0 0 0 9 0V3" />
              <path d="M9 12.5v4a4.5 4.5 0 0 0 9 0v-2.5" />
              <circle cx="18" cy="14" r="3" />
            </svg>
          );
        case 'alert':
          return (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          );
        case 'ribbon':
          return (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <path d="M12 2a5 5 0 0 0-5 5c0 3.5 5 9 5 9s5-5.5 5-9a5 5 0 0 0-5-5z" />
              <path d="M9 16l-3 6" />
              <path d="M15 16l3 6" />
            </svg>
          );
        case 'heart':
          return (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 7.65l.77.78L12 20.66l7.65-7.65.77-.78a5.4 5.4 0 0 0 0-7.65z" />
            </svg>
          );
        default:
          return null;
      }
    };

    return () => (
      <div class="main-content patients-page-layout">
        <div class="patients-container">
          {/* Header Banner */}
          <div class="patients-header-card">
            <div class="patients-header-top">
              <div class="patients-title-group">
                <div class="patients-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <line x1="20" y1="8" x2="20" y2="14" />
                    <line x1="23" y1="11" x2="17" y2="11" />
                  </svg>
                  <span>Espace Clinique Hospitalier</span>
                </div>
                <h1 class="patients-main-title">Liste des Patients</h1>
                <p class="patients-subtitle">
                  Consultation des admissions hospitalières par service médical.
                </p>
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
                    <button
                      key={tab.id}
                      id={`tab-${tab.id}`}
                      role="tab"
                      aria-selected={isActive}
                      class={`tab-button ${isActive ? 'tab-button-active' : ''}`}
                      onClick={() => fetchPatients(tab.id)}
                    >
                      <span class="tab-icon">{renderTabIcon(tab.icon)}</span>
                      <span class="tab-label">{tab.label}</span>
                      {isActive && (
                        <span class="tab-count-badge">
                          {loading.value ? '...' : patients.value.length}
                        </span>
                      )}
                    </button>
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

          {/* Table Content */}
          <div class="patients-table-wrapper">
            {loading.value ? (
              <div class="patients-loading-state">
                <div class="spinner" style={{ width: '32px', height: '32px', borderWidth: '3px' }} />
                <p>Chargement des dossiers médicaux ({activeService.value})...</p>
              </div>
            ) : patients.value.length === 0 ? (
              <div class="patients-empty-state">
                <div class="empty-icon-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <h3>Aucun patient trouvé</h3>
                <p>
                  {`Aucun patient n'est actuellement répertorié dans le service ${activeService.value}.`}
                </p>
              </div>
            ) : (
              <div class="table-responsive">
                <table class="patients-table">
                  <thead>
                    <tr>
                      {/* Common fields requested by user */}
                      <th style={{ width: '180px' }}>Nom</th>
                      <th style={{ width: '180px' }}>Prénom</th>
                      <th style={{ width: '190px' }}>Date d’hospitalisation</th>

                      {/* Service-specific fields */}
                      {activeService.value === 'general' && (
                        <th>Service</th>
                      )}

                      {activeService.value === 'urgence' && (
                        <>
                          <th style={{ width: '140px' }}>Heure d’arrivée</th>
                          <th style={{ width: '220px' }}>Niveau de triage</th>
                          <th>Gravité initiale</th>
                        </>
                      )}

                      {activeService.value === 'oncologie' && (
                        <>
                          <th style={{ width: '220px' }}>Type de tumeur</th>
                          <th style={{ width: '110px' }}>Stade</th>
                          <th>Traitement en cours</th>
                        </>
                      )}

                      {activeService.value === 'cardiologie' && (
                        <>
                          <th style={{ width: '220px' }}>Résultats ECG</th>
                          <th style={{ width: '170px' }}>Fréq. cardiaque (repos)</th>
                          <th style={{ width: '150px' }}>Tension artérielle</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {patients.value.map((patient) => {
                      const urgence = patient as UrgencePatient;
                      const onco = patient as OncologiePatient;
                      const cardio = patient as CardiologiePatient;

                      return (
                        <tr key={patient.id} class="patient-row">
                          {/* Common Fields */}
                          <td class="patient-cell-nom">
                            <span class="patient-name-primary">{patient.nom}</span>
                          </td>
                          <td class="patient-cell-prenom">
                            <span class="patient-name-secondary">{patient.prenom}</span>
                          </td>
                          <td class="patient-cell-date">
                            <div class="date-badge">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                              </svg>
                              <span>{formatDate(patient.date_hospitalisation)}</span>
                            </div>
                          </td>

                          {/* Service-specific rows */}
                          {activeService.value === 'general' && (
                            <td>
                              <span class="service-pill service-general">
                                Médecine Générale
                              </span>
                            </td>
                          )}

                          {activeService.value === 'urgence' && (
                            <>
                              <td>
                                <span class="time-badge">
                                  {urgence.heure_arrivee || '—'}
                                </span>
                              </td>
                              <td>{getTriageBadge(urgence.niveau_triage)}</td>
                              <td>
                                <span class="gravity-text">
                                  {urgence.gravite_initiale || '—'}
                                </span>
                              </td>
                            </>
                          )}

                          {activeService.value === 'oncologie' && (
                            <>
                              <td>
                                <span class="tumor-type">
                                  {onco.type_tumeur || '—'}
                                </span>
                              </td>
                              <td>
                                <span class="stade-badge">
                                  {onco.stade ? `Stade ${onco.stade}` : '—'}
                                </span>
                              </td>
                              <td>
                                <span class="treatment-text">
                                  {onco.traitement_en_cours || '—'}
                                </span>
                              </td>
                            </>
                          )}

                          {activeService.value === 'cardiologie' && (
                            <>
                              <td>
                                <span class="ecg-text">
                                  {cardio.resultats_ecg || '—'}
                                </span>
                              </td>
                              <td>
                                <span class="heart-rate-badge">
                                  <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                  </svg>
                                  {cardio.frequence_cardiaque_repos
                                    ? `${cardio.frequence_cardiaque_repos} bpm`
                                    : '—'}
                                </span>
                              </td>
                              <td>
                                <span class="tension-badge">
                                  {cardio.tension_arterielle || '—'}
                                </span>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
});

export default PatientsView;
