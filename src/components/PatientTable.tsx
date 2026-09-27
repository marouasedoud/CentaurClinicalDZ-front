import { defineComponent, ref } from 'vue';
import type { PropType } from 'vue';
import type {
    PatientRow,
    PatientService,
    UrgencePatient,
    OncologiePatient,
    CardiologiePatient,
} from '../types';
import { STAGE_LEVELS, TRIAGE_LEVELS } from '../constants/patient-options';

type PatientUpdates = Partial<PatientRow>;

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
        deletePatient: {
            type: Function as PropType<(patientId: string) => void>,
            required: true,
        },
        deletingPatientId: {
            type: String as PropType<string | null>,
            default: null,
        },
        updatePatient: {
            type: Function as PropType<(patientId: string, updates: PatientUpdates) => Promise<boolean>>,
            required: true,
        },
        updatingPatientId: {
            type: String as PropType<string | null>,
            default: null,
        },
    },
    setup(props) {
        const editingPatientId = ref<string | null>(null);
        const draft = ref<Record<string, string>>({});

        const formatDate = (dateStr: string): string => {
            if (!dateStr) return '—';
            return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        };

        const stageValue = (value?: string | number): number | undefined => {
            if (typeof value === 'number') return value;
            const romanValues: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4 };
            return value ? romanValues[value.toUpperCase()] || Number(value) || undefined : undefined;
        };

        const getTriageLevel = (level?: number) =>
            TRIAGE_LEVELS.find((option) => option.value === Number(level));

        const getStageLevel = (value?: string | number) =>
            STAGE_LEVELS.find((option) => option.value === stageValue(value));

        const startEditing = (patient: PatientRow): void => {
            const values: Record<string, string> = {
                nom: patient.nom,
                prenom: patient.prenom,
                date_hospitalisation: formatDate(patient.date_hospitalisation),
            };

            if (patient.service === 'urgence') {
                const urgence = patient as UrgencePatient;
                values.heure_arrivee = urgence.heure_arrivee || '';
                values.niveau_triage = String(urgence.niveau_triage || '');
                values.gravite_initiale = urgence.gravite_initiale || '';
            } else if (patient.service === 'oncologie') {
                const onco = patient as OncologiePatient;
                values.type_tumeur = onco.type_tumeur || '';
                values.stade = String(stageValue(onco.stade) || '');
                values.traitement_en_cours = onco.traitement_en_cours || '';
            } else if (patient.service === 'cardiologie') {
                const cardio = patient as CardiologiePatient;
                values.resultats_ecg = cardio.resultats_ecg || '';
                values.frequence_cardiaque_repos = cardio.frequence_cardiaque_repos == null
                    ? ''
                    : String(cardio.frequence_cardiaque_repos);
                values.tension_arterielle = cardio.tension_arterielle || '';
            }

            editingPatientId.value = patient.id;
            draft.value = values;
        };

        const setDraftValue = (field: string, value: string): void => {
            draft.value[field] = value;
        };

        const renderInput = (field: string, type = 'text') => (
            <input
                class="patient-edit-input"
                aria-label={field}
                type={type}
                value={draft.value[field]}
                step={type === 'number' ? '1' : undefined}
                onInput={(event) => setDraftValue(field, (event.target as HTMLInputElement).value)}
            />
        );

        const renderSelect = (
            field: string,
            options: typeof TRIAGE_LEVELS | typeof STAGE_LEVELS,
            selectedClass: string
        ) => (
            <select
                class={`patient-edit-select ${selectedClass}`}
                aria-label={field}
                value={draft.value[field]}
                onChange={(event) => setDraftValue(field, (event.target as HTMLSelectElement).value)}
            >
                <option value="">Sélectionner</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value} class={option.className}>
                        {option.label}
                    </option>
                ))}
            </select>
        );

        const buildUpdates = (patient: PatientRow): PatientUpdates => {
            const updates: Record<string, string | number | undefined> = {
                nom: draft.value.nom,
                prenom: draft.value.prenom,
                date_hospitalisation: draft.value.date_hospitalisation,
            };

            if (patient.service === 'urgence') {
                updates.heure_arrivee = draft.value.heure_arrivee;
                updates.niveau_triage = Number(draft.value.niveau_triage);
                updates.gravite_initiale = draft.value.gravite_initiale;
            } else if (patient.service === 'oncologie') {
                updates.type_tumeur = draft.value.type_tumeur;
                updates.stade = Number(draft.value.stade);
                updates.traitement_en_cours = draft.value.traitement_en_cours;
            } else if (patient.service === 'cardiologie') {
                updates.resultats_ecg = draft.value.resultats_ecg;
                updates.frequence_cardiaque_repos = draft.value.frequence_cardiaque_repos
                    ? Number(draft.value.frequence_cardiaque_repos)
                    : undefined;
                updates.tension_arterielle = draft.value.tension_arterielle;
            }

            return updates as PatientUpdates;
        };

        const cancelEditing = (): void => {
            editingPatientId.value = null;
            draft.value = {};
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
                                    <th style={{ width: '90px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {props.patients.map((patient) => {
                                    const urgence = patient as UrgencePatient;
                                    const onco = patient as OncologiePatient;
                                    const cardio = patient as CardiologiePatient;
                                    const isEditing = editingPatientId.value === patient.id;
                                    const triage = getTriageLevel(
                                        isEditing ? Number(draft.value.niveau_triage) : urgence.niveau_triage
                                    );
                                    const stage = getStageLevel(
                                        isEditing ? Number(draft.value.stade) : onco.stade
                                    );

                                    return (
                                        <tr key={patient.id} class="patient-row">
                                            <td class="patient-cell-nom">
                                                {isEditing ? renderInput('nom') : (
                                                    <span class="patient-name-primary">{patient.nom}</span>
                                                )}
                                            </td>
                                            <td class="patient-cell-prenom">
                                                {isEditing ? renderInput('prenom') : (
                                                    <span class="patient-name-secondary">{patient.prenom}</span>
                                                )}
                                            </td>
                                            <td class="patient-cell-date">
                                                {isEditing ? renderInput('date_hospitalisation', 'date') : (
                                                    <div class="date-badge">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
                                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                            <line x1="16" y1="2" x2="16" y2="6" />
                                                            <line x1="8" y1="2" x2="8" y2="6" />
                                                            <line x1="3" y1="10" x2="21" y2="10" />
                                                        </svg>
                                                        <span>{formatDate(patient.date_hospitalisation)}</span>
                                                    </div>
                                                )}
                                            </td>
                                            {props.service === 'urgence' && (
                                                <>
                                                    <td>{isEditing ? renderInput('heure_arrivee', 'time') : <span class="time-badge">{urgence.heure_arrivee || '—'}</span>}</td>
                                                    <td>{isEditing
                                                        ? renderSelect('niveau_triage', TRIAGE_LEVELS, triage?.className || '')
                                                        : <span class={`triage-badge ${triage?.className || 'triage-5'}`}>{triage?.label || 'N/A'}</span>}
                                                    </td>
                                                    <td>{isEditing ? renderInput('gravite_initiale') : <span class="gravity-text">{urgence.gravite_initiale || '—'}</span>}</td>
                                                </>
                                            )}
                                            {props.service === 'oncologie' && (
                                                <>
                                                    <td>{isEditing ? renderInput('type_tumeur') : <span class="tumor-type">{onco.type_tumeur || '—'}</span>}</td>
                                                    <td>{isEditing
                                                        ? renderSelect('stade', STAGE_LEVELS, stage?.className || '')
                                                        : <span class={`stade-badge ${stage?.className || ''}`}>{stage?.label || '—'}</span>}
                                                    </td>
                                                    <td>{isEditing ? renderInput('traitement_en_cours') : <span class="treatment-text">{onco.traitement_en_cours || '—'}</span>}</td>
                                                </>
                                            )}
                                            {props.service === 'cardiologie' && (
                                                <>
                                                    <td>{isEditing ? renderInput('resultats_ecg') : <span class="ecg-text">{cardio.resultats_ecg || '—'}</span>}</td>
                                                    <td>{isEditing ? renderInput('frequence_cardiaque_repos', 'number') : (
                                                        <span class="heart-rate-badge">
                                                            <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                                                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                                            </svg>
                                                            {cardio.frequence_cardiaque_repos ? `${cardio.frequence_cardiaque_repos} bpm` : '—'}
                                                        </span>
                                                    )}</td>
                                                    <td>{isEditing ? renderInput('tension_arterielle') : <span class="tension-badge">{cardio.tension_arterielle || '—'}</span>}</td>
                                                </>
                                            )}
                                            <td>
                                                <div class="patient-row-actions">
                                                    {isEditing ? (
                                                        <>
                                                            <button
                                                                type="button"
                                                                class="btn btn-primary patient-row-action-button"
                                                                aria-label="Validate"
                                                                disabled={props.updatingPatientId === patient.id}
                                                                onClick={async () => {
                                                                    const updated = await props.updatePatient(patient.id, buildUpdates(patient));
                                                                    if (updated) cancelEditing();
                                                                }}
                                                            >
                                                                Validate
                                                            </button>
                                                            <button type="button" class="btn btn-outline patient-row-action-button" aria-label="Cancel" onClick={cancelEditing}>
                                                                Cancel
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                type="button"
                                                                class="patient-edit-button"
                                                                aria-label={`Modifier ${patient.prenom} ${patient.nom}`}
                                                                title="Modifier le patient"
                                                                onClick={() => startEditing(patient)}
                                                            >
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" aria-hidden="true">
                                                                    <path d="M12 20h9" />
                                                                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                class="patient-delete-button"
                                                                aria-label={`Supprimer ${patient.prenom} ${patient.nom}`}
                                                                title="Supprimer le patient"
                                                                disabled={props.deletingPatientId === patient.id}
                                                                onClick={() => {
                                                                    if (window.confirm(`Voulez-vous vraiment supprimer ${patient.prenom} ${patient.nom} ?`)) {
                                                                        props.deletePatient(patient.id);
                                                                    }
                                                                }}
                                                            >
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" aria-hidden="true">
                                                                    <polyline points="3 6 5 6 21 6" />
                                                                    <path d="M19 6l-1 14H6L5 6m3 0V4h8v2m-7 4v7m4-7v7" />
                                                                </svg>
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
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