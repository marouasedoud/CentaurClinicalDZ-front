import { defineComponent, onScopeDispose, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../auth/use-auth';
import { defaultPatientApi } from '../api/patient.api';
import type { PatientApi } from '../api/patient.api';
import type { CreatePatientPayload, PatientService } from '../types';
import { STAGE_LEVELS, TRIAGE_LEVELS } from '../constants/patient-options';

type FormValues = Record<string, string>;
type Feedback = { type: 'success' | 'error'; message: string } | null;

const SERVICES: Array<{ value: PatientService; label: string }> = [
    { value: 'general', label: 'General' },
    { value: 'urgence', label: 'Urgence' },
    { value: 'oncologie', label: 'Oncologie' },
    { value: 'cardiologie', label: 'Cardiologie' },
];

const EMPTY_VALUES: FormValues = {
    nom: '',
    prenom: '',
    date_hospitalisation: '',
    heure_arrivee: '',
    niveau_triage: '',
    gravite_initiale: '',
    type_tumeur: '',
    stade: '',
    traitement_en_cours: '',
    resultats_ecg: '',
    frequence_cardiaque_repos: '',
    tension_arterielle: '',
};

export const CreatePatientView = defineComponent({
    name: 'CreatePatientView',
    props: {
        patientApi: {
            type: Object as () => PatientApi,
            default: () => defaultPatientApi,
        },
    },
    setup(props) {
        const router = useRouter();
        const { accessToken } = useAuth();
        const service = ref<PatientService | ''>('');
        const values = ref<FormValues>({ ...EMPTY_VALUES });
        const feedback = ref<Feedback>(null);
        const submitting = ref(false);
        let feedbackTimeout: ReturnType<typeof setTimeout> | undefined;

        const clearFeedbackTimeout = (): void => {
            if (feedbackTimeout) {
                clearTimeout(feedbackTimeout);
                feedbackTimeout = undefined;
            }
        };

        const showFeedback = (type: 'success' | 'error', message: string): void => {
            clearFeedbackTimeout();
            feedback.value = { type, message };
            feedbackTimeout = setTimeout(() => {
                feedback.value = null;
                feedbackTimeout = undefined;
            }, 5000);
        };

        onScopeDispose(clearFeedbackTimeout);

        const updateValue = (field: string, value: string): void => {
            values.value[field] = value;
        };

        const changeService = (nextService: string): void => {
            service.value = nextService as PatientService | '';
            values.value = {
                ...EMPTY_VALUES,
                nom: values.value.nom,
                prenom: values.value.prenom,
                date_hospitalisation: values.value.date_hospitalisation,
            };
        };

        const resetForm = (): void => {
            service.value = '';
            values.value = { ...EMPTY_VALUES };
        };

        const isValidDate = (value: string): boolean => {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
            const [year, month, day] = value.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            return date.getFullYear() === year &&
                date.getMonth() === month - 1 &&
                date.getDate() === day;
        };

        const isValidText = (field: string, maxLength: number): boolean => {
            const length = values.value[field].trim().length;
            return length >= 1 && length <= maxLength;
        };

        const validate = (): boolean => {
            if (
                !service.value ||
                !isValidText('nom', 100) ||
                !isValidText('prenom', 100) ||
                !isValidDate(values.value.date_hospitalisation)
            ) {
                return false;
            }

            if (service.value === 'urgence') {
                return /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(values.value.heure_arrivee) &&
                    TRIAGE_LEVELS.some((option) => option.value === Number(values.value.niveau_triage)) &&
                    isValidText('gravite_initiale', 100);
            }
            if (service.value === 'oncologie') {
                return isValidText('type_tumeur', 150) &&
                    STAGE_LEVELS.some((option) => option.value === Number(values.value.stade)) &&
                    isValidText('traitement_en_cours', 255);
            }
            if (service.value === 'cardiologie') {
                const heartRate = Number(values.value.frequence_cardiaque_repos);
                return isValidText('resultats_ecg', 255) &&
                    Number.isInteger(heartRate) && heartRate > 0 &&
                    isValidText('tension_arterielle', 20);
            }
            return true;
        };

        const buildPayload = (): CreatePatientPayload => {
            const currentService = service.value as PatientService;
            const payload: CreatePatientPayload = {
                service: currentService,
                nom: values.value.nom.trim(),
                prenom: values.value.prenom.trim(),
                date_hospitalisation: values.value.date_hospitalisation,
            };

            if (currentService === 'urgence') {
                payload.heure_arrivee = values.value.heure_arrivee;
                payload.niveau_triage = Number(values.value.niveau_triage);
                payload.gravite_initiale = values.value.gravite_initiale.trim();
            } else if (currentService === 'oncologie') {
                payload.type_tumeur = values.value.type_tumeur.trim();
                payload.stade = Number(values.value.stade);
                payload.traitement_en_cours = values.value.traitement_en_cours.trim();
            } else if (currentService === 'cardiologie') {
                payload.resultats_ecg = values.value.resultats_ecg.trim();
                payload.frequence_cardiaque_repos = Number(values.value.frequence_cardiaque_repos);
                payload.tension_arterielle = values.value.tension_arterielle.trim();
            }

            return payload;
        };

        const createPatient = async (event: Event): Promise<void> => {
            event.preventDefault();
            if (!validate()) {
                showFeedback('error', 'Please complete all required fields with valid values.');
                return;
            }

            submitting.value = true;
            try {
                const response = await props.patientApi.createPatient(
                    buildPayload(),
                    accessToken.value || undefined
                );
                if (response.statusCode !== 201) {
                    showFeedback('error', response.message || 'Unable to create patient.');
                    return;
                }
                showFeedback('success', 'Patient created successfully.');
                resetForm();
            } catch (err: any) {
                const status = err?.response?.status;
                const message = err?.response?.data?.message ||
                    (status === 401
                        ? 'Session expired or not authorized.'
                        : status === 400
                            ? 'The patient information was rejected. Please review the fields.'
                            : err?.message || 'Unable to create patient.');
                showFeedback('error', message);
            } finally {
                submitting.value = false;
            }
        };

        const cancel = (): void => {
            resetForm();
            void router.push('/patients');
        };

        const renderInput = (
            field: string,
            label: string,
            type = 'text',
            maxLength?: number,
            min?: number,
            max?: number
        ) => (
            <div class="create-patient-field">
                <label class="form-label" for={`create-${field}`}>{label}</label>
                <input
                    class="create-patient-input"
                    id={`create-${field}`}
                    name={field}
                    aria-label={label}
                    type={type}
                    value={values.value[field]}
                    required
                    minlength={type === 'text' ? 1 : undefined}
                    maxlength={maxLength}
                    min={min}
                    max={max}
                    step={type === 'number' ? '1' : undefined}
                    onInput={(event) => updateValue(field, (event.target as HTMLInputElement).value)}
                />
            </div>
        );

        const renderSelect = (
            field: string,
            label: string,
            options: typeof TRIAGE_LEVELS | typeof STAGE_LEVELS
        ) => {
            const selected = options.find((option) => option.value === Number(values.value[field]));
            return (
                <div class="create-patient-field">
                    <label class="form-label" for={`create-${field}`}>{label}</label>
                    <select
                        class={`create-patient-input patient-edit-select ${selected?.className || ''}`}
                        id={`create-${field}`}
                        name={field}
                        aria-label={label}
                        value={values.value[field]}
                        required
                        onChange={(event) => updateValue(field, (event.target as HTMLSelectElement).value)}
                    >
                        <option value="">Select a value</option>
                        {options.map((option) => (
                            <option key={option.value} value={option.value} class={option.className}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            );
        };

        return () => (
            <main class="main-content create-patient-page">
                <section class="create-patient-container" aria-labelledby="create-patient-title">
                    {feedback.value && (
                        <div
                            class={`alert ${feedback.value.type === 'success' ? 'alert-success' : 'alert-danger'}`}
                            role={feedback.value.type === 'success' ? 'status' : 'alert'}
                        >
                            {feedback.value.message}
                        </div>
                    )}
                    <header class="create-patient-header">
                        <h1 id="create-patient-title">Create Patient</h1>
                    </header>

                    <form class="create-patient-form" novalidate onSubmit={createPatient}>
                        <div class="create-patient-field">
                            <label class="form-label" for="create-service">Service</label>
                            <select
                                class="create-patient-input"
                                id="create-service"
                                name="service"
                                aria-label="Service"
                                value={service.value}
                                required
                                onChange={(event) => changeService((event.target as HTMLSelectElement).value)}
                            >
                                <option value="">Select a service</option>
                                {SERVICES.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>

                        {service.value && (
                            <div class="create-patient-fields">
                                {renderInput('nom', 'Last name', 'text', 100)}
                                {renderInput('prenom', 'First name', 'text', 100)}
                                {renderInput('date_hospitalisation', 'Hospitalization date', 'date')}
                                {service.value === 'urgence' && (
                                    <>
                                        {renderInput('heure_arrivee', 'Arrival time', 'time')}
                                        {renderSelect('niveau_triage', 'Triage level', TRIAGE_LEVELS)}
                                        {renderInput('gravite_initiale', 'Initial severity', 'text', 100)}
                                    </>
                                )}
                                {service.value === 'oncologie' && (
                                    <>
                                        {renderInput('type_tumeur', 'Tumor type', 'text', 150)}
                                        {renderSelect('stade', 'Stage', STAGE_LEVELS)}
                                        {renderInput('traitement_en_cours', 'Current treatment', 'text', 255)}
                                    </>
                                )}
                                {service.value === 'cardiologie' && (
                                    <>
                                        {renderInput('resultats_ecg', 'ECG results', 'text', 255)}
                                        {renderInput('frequence_cardiaque_repos', 'Resting heart rate', 'number', undefined, 1)}
                                        {renderInput('tension_arterielle', 'Blood pressure', 'text', 20)}
                                    </>
                                )}
                            </div>
                        )}

                        <div class="create-patient-actions">
                            <button type="submit" class="btn btn-primary" disabled={submitting.value || !service.value}>
                                {submitting.value ? 'Creating...' : 'Create'}
                            </button>
                            <button type="button" class="btn btn-outline" onClick={cancel}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </section>
            </main>
        );
    },
});

export default CreatePatientView;