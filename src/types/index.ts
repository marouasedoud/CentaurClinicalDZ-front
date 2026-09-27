import type { Router } from 'vue-router';

/**
 * Authenticated user profile information returned from the backend.
 */
export interface UserProfile {
  id: string;
  username: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Access and refresh token pair issued by backend JWT service.
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * User login request payload.
 */
export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * Standard backend API response envelope.
 */
export interface ApiResponse<T = unknown> {
  status: 'success' | 'fail' | 'error';
  statusCode: number;
  message?: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}

/**
 * Payload returned on successful login.
 */
export interface LoginResponseData {
  user: UserProfile;
  tokens: AuthTokens;
}

/**
 * Payload returned by /me endpoint.
 */
export interface MeResponseData {
  user: UserProfile;
}

/**
 * Reactive frontend authentication state.
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Configuration options for the Centaur Auth Plugin.
 */
export interface CentaurAuthPluginOptions {
  apiUrl?: string;
  storageKeyPrefix?: string;
  loginRoutePath?: string;
  defaultRedirectPath?: string;
  router?: Router;
}

/**
 * Service departments supported by the patient API.
 */
export type PatientService = 'general' | 'urgence' | 'oncologie' | 'cardiologie';

/**
 * Common fields present on all patient records.
 */
export interface Patient {
  id: string;
  nom: string;
  prenom: string;
  date_hospitalisation: string;
  service: PatientService;
  created_at?: string;
  updated_at?: string;
}

/**
 * Service-specific patient types.
 */
export type GeneralPatient = Patient;

export interface UrgencePatient extends Patient {
  heure_arrivee?: string;
  niveau_triage?: number;
  gravite_initiale?: string;
}

export interface OncologiePatient extends Patient {
  type_tumeur?: string;
  stade?: string | number;
  traitement_en_cours?: string;
}

export interface CardiologiePatient extends Patient {
  resultats_ecg?: string;
  frequence_cardiaque_repos?: number;
  tension_arterielle?: string;
}

export type PatientRow =
  | GeneralPatient
  | UrgencePatient
  | OncologiePatient
  | CardiologiePatient;

export type CreatePatientPayload = Omit<Patient, 'id' | 'created_at' | 'updated_at'> & {
  heure_arrivee?: string;
  niveau_triage?: number;
  gravite_initiale?: string;
  type_tumeur?: string;
  stade?: number;
  traitement_en_cours?: string;
  resultats_ecg?: string;
  frequence_cardiaque_repos?: number;
  tension_arterielle?: string;
};

/**
 * Payload returned by GET /api/patients?service=<service>.
 */
export interface GetPatientsResponseData {
  service: PatientService;
  count: number;
  patients: PatientRow[];
}

