import { onScopeDispose, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../auth/use-auth';
import { defaultPatientApi } from '../api/patient.api';
import type { PatientApi } from '../api/patient.api';
import type { PatientRow, PatientService } from '../types';

export function usePatients(patientApi: PatientApi = defaultPatientApi) {
  const { accessToken, logout } = useAuth();
  const router = useRouter();
  const patients = ref<PatientRow[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const deleteSuccess = ref<string | null>(null);
  const deleteError = ref<string | null>(null);
  const deletingPatientId = ref<string | null>(null);
  const updateSuccess = ref<string | null>(null);
  const updateError = ref<string | null>(null);
  const updatingPatientId = ref<string | null>(null);
  let deleteFeedbackTimeout: ReturnType<typeof setTimeout> | undefined;
  let updateFeedbackTimeout: ReturnType<typeof setTimeout> | undefined;

  const clearDeleteFeedbackTimeout = (): void => {
    if (deleteFeedbackTimeout) {
      clearTimeout(deleteFeedbackTimeout);
      deleteFeedbackTimeout = undefined;
    }
  };

  const dismissDeleteFeedback = (): void => {
    deleteSuccess.value = null;
    deleteError.value = null;
    deleteFeedbackTimeout = undefined;
  };

  const clearUpdateFeedbackTimeout = (): void => {
    if (updateFeedbackTimeout) {
      clearTimeout(updateFeedbackTimeout);
      updateFeedbackTimeout = undefined;
    }
  };

  const dismissUpdateFeedback = (): void => {
    updateSuccess.value = null;
    updateError.value = null;
    updateFeedbackTimeout = undefined;
  };

  onScopeDispose(() => {
    clearDeleteFeedbackTimeout();
    clearUpdateFeedbackTimeout();
  });

  const fetchPatients = async (service: PatientService): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      const response = await patientApi.getPatientsByService(
        service,
        accessToken.value || undefined
      );

      patients.value = Array.isArray(response.data?.patients)
        ? response.data.patients
        : [];
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

  const deletePatient = async (id: string): Promise<void> => {
    clearDeleteFeedbackTimeout();
    deleteSuccess.value = null;
    deleteError.value = null;
    deletingPatientId.value = id;

    try {
      await patientApi.deletePatient(id, accessToken.value || undefined);
      patients.value = patients.value.filter((patient) => patient.id !== id);
      deleteSuccess.value = 'Patient supprimé avec succès.';
    } catch (err: any) {
      deleteError.value =
        err?.response?.data?.message ||
        err?.message ||
        'Erreur lors de la suppression du patient.';
    } finally {
      deletingPatientId.value = null;
      deleteFeedbackTimeout = setTimeout(dismissDeleteFeedback, 5000);
    }
  };

  const updatePatient = async (
    id: string,
    updates: Partial<PatientRow>
  ): Promise<boolean> => {
    clearUpdateFeedbackTimeout();
    updateSuccess.value = null;
    updateError.value = null;
    updatingPatientId.value = id;

    try {
      const response = await patientApi.updatePatient(
        id,
        updates,
        accessToken.value || undefined
      );
      const responseData = response.data;
      const updatedPatient = responseData && 'patient' in responseData
        ? responseData.patient
        : responseData;
      patients.value = patients.value.map((patient) =>
        patient.id === id
          ? { ...patient, ...updatedPatient, ...(!updatedPatient ? updates : {}) } as PatientRow
          : patient
      );
      updateSuccess.value = 'Updated successfully';
      return true;
    } catch (err: any) {
      updateError.value =
        err?.response?.data?.message ||
        err?.message ||
        'Unable to update patient.';
      return false;
    } finally {
      updatingPatientId.value = null;
      updateFeedbackTimeout = setTimeout(dismissUpdateFeedback, 5000);
    }
  };

  return {
    patients,
    loading,
    error,
    deleteSuccess,
    deleteError,
    deletingPatientId,
    updateSuccess,
    updateError,
    updatingPatientId,
    fetchPatients,
    deletePatient,
    updatePatient,
  };
}