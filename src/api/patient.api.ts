import type { AxiosInstance } from 'axios';
import { defaultApiClient } from './client';
import type {
  ApiResponse,
  PatientService,
  GetPatientsResponseData,
} from '../types';

export class PatientApi {
  constructor(private readonly client: AxiosInstance = defaultApiClient) {}

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
}

export const defaultPatientApi = new PatientApi();
