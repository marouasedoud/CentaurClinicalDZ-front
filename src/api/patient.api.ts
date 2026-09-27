import type { AxiosInstance } from 'axios';
import { defaultApiClient } from './client';
import type {
  ApiResponse,
  PatientService,
  GetPatientsResponseData,
  PatientRow,
  CreatePatientPayload,
} from '../types';

export class PatientApi {
  constructor(private readonly client: AxiosInstance = defaultApiClient) { }

  /**
   * Retrieves patients for a specific service department.
   * Calls: GET /api/patients?service=<service>
   *
   * The Axios client interceptor automatically attaches:
   *   Authorization: Bearer <access_token>
   * If an explicit accessToken is provided, it is attached directly to request headers.
   */
  async getPatientsByService(
    service: PatientService,
    accessToken?: string
  ): Promise<ApiResponse<GetPatientsResponseData>> {
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await this.client.get<ApiResponse<GetPatientsResponseData>>('/api/patients', {
      params: { service },
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    });

    return response.data;
  }

  /**
   * Creates a patient record.
   * Calls: POST /api/patients
   */
  async createPatient(
    patient: CreatePatientPayload,
    accessToken?: string
  ): Promise<ApiResponse<PatientRow>> {
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await this.client.post<ApiResponse<PatientRow>>('/api/patients', patient, {
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    });

    return response.data;
  }

  /**
   * Deletes a patient by ID.
   * Calls: DELETE /api/patients/:id
   */
  async deletePatient(id: string, accessToken?: string): Promise<void> {
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    await this.client.delete(`/api/patients/${encodeURIComponent(id)}`, {
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    });
  }

  /**
   * Updates patient fields by ID.
   * Calls: PATCH /api/patients/:id
   */
  async updatePatient(
    id: string,
    updates: Partial<PatientRow>,
    accessToken?: string
  ): Promise<ApiResponse<PatientRow | { patient: PatientRow }>> {
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await this.client.patch<ApiResponse<PatientRow | { patient: PatientRow }>>(
      `/api/patients/${encodeURIComponent(id)}`,
      updates,
      { headers: Object.keys(headers).length > 0 ? headers : undefined }
    );

    return response.data;
  }
}

export const defaultPatientApi = new PatientApi();
