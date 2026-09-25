import { defineComponent } from 'vue';
import type { PropType } from 'vue';
import type {
    PatientRow,
    PatientService,
    UrgencePatient,
    OncologiePatient,
    CardiologiePatient,
} from '../types';

export const PatientTable = defineComponent({
    name: 'PatientTable',
    props: {
        patients: {
            type: Array as PropType<PatientRow[]>,
            required: true,
        },
        service: {
            type: String as PropType<PatientService>,
            required: true,
        },
        loading: {
            type: Boolean,
            required: true,
        },
    },
    setup(props) {
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

        return () => (
            <div class="patients-table-wrapper">
                {props.loading ? (
                    <div class="patients-loading-state">
                        <div class="spinner" style={{ width: '32px', height: '32px', borderWidth: '3px' }} />
                        <p>Chargement des dossiers médicaux ({props.service})...</p>
                    </div>
                ) : props.patients.length === 0 ? (
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
                            {`Aucun patient n'est actuellement répertorié dans le service ${props.service}.`}
                        </p>
                    </div>
                ) : (
                    <div class="table-responsive">
                        <table class="patients-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '180px' }}>Nom</th>
                                    <th style={{ width: '180px' }}>Prénom</th>
                                    <th style={{ width: '190px' }}>Date d’hospitalisation</th>
                                    {props.service === 'general' && <th>Service</th>}
                                    {props.service === 'urgence' && (
                                        <>
                                            <th style={{ width: '140px' }}>Heure d’arrivée</th>
                                            <th style={{ width: '220px' }}>Niveau de triage</th>
                                            <th>Gravité initiale</th>
                                        </>
                                    )}
                                    {props.service === 'oncologie' && (
                                        <>
                                            <th style={{ width: '220px' }}>Type de tumeur</th>
                                            <th style={{ width: '110px' }}>Stade</th>
                                            <th>Traitement en cours</th>
                                        </>
                                    )}
                                    {props.service === 'cardiologie' && (
                                        <>
                                            <th style={{ width: '220px' }}>Résultats ECG</th>
                                            <th style={{ width: '170px' }}>Fréq. cardiaque (repos)</th>
                                            <th style={{ width: '150px' }}>Tension artérielle</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {props.patients.map((patient) => {
                                    const urgence = patient as UrgencePatient;
                                    const onco = patient as OncologiePatient;
                                    const cardio = patient as CardiologiePatient;

                                    return (
                                        <tr key={patient.id} class="patient-row">
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
                                            {props.service === 'general' && (
                                                <td>
                                                    <span class="service-pill service-general">Médecine Générale</span>
                                                </td>
                                            )}
                                            {props.service === 'urgence' && (
                                                <>
                                                    <td><span class="time-badge">{urgence.heure_arrivee || '—'}</span></td>
                                                    <td>{getTriageBadge(urgence.niveau_triage)}</td>
                                                    <td><span class="gravity-text">{urgence.gravite_initiale || '—'}</span></td>
                                                </>
                                            )}
                                            {props.service === 'oncologie' && (
                                                <>
                                                    <td><span class="tumor-type">{onco.type_tumeur || '—'}</span></td>
                                                    <td>
                                                        <span class="stade-badge">{onco.stade ? `Stade ${onco.stade}` : '—'}</span>
                                                    </td>
                                                    <td><span class="treatment-text">{onco.traitement_en_cours || '—'}</span></td>
                                                </>
                                            )}
                                            {props.service === 'cardiologie' && (
                                                <>
                                                    <td><span class="ecg-text">{cardio.resultats_ecg || '—'}</span></td>
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
                                                    <td><span class="tension-badge">{cardio.tension_arterielle || '—'}</span></td>
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
        );
    },
});

export default PatientTable;