import { ref } from 'vue';
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

  return { patients, loading, error, fetchPatients };
}