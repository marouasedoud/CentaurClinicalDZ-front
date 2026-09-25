import './styles/index.css';

// Plugin
export { CentaurAuth, createCentaurAuth } from './plugin';

// Composition API Hook
export { useAuth, provideAuthService, AUTH_SERVICE_KEY } from './auth/use-auth';

// Services
export { AuthService, defaultAuthService } from './auth/auth.service';
export { TokenStorageService, defaultStorage } from './auth/storage.service';

// API
export { AuthApi, defaultAuthApi } from './api/auth.api';
export { PatientApi, defaultPatientApi } from './api/patient.api';
export { createApiClient, defaultApiClient } from './api/client';

// Router & Route Protection
export { createAuthGuard, setupAuthGuard } from './router/guard';
export type { AuthGuardOptions } from './router/guard';
export { defaultAuthRoutes } from './router/routes';

// JSX Components & Views
export { LoginForm } from './components/LoginForm';
export { Navbar } from './components/Navbar';
export { LoginView } from './views/LoginView';
export { WelcomeView } from './views/WelcomeView';
export { PatientsView } from './views/PatientsView';

// TypeScript Types
export type {
  UserProfile,
  AuthTokens,
  LoginCredentials,
  ApiResponse,
  LoginResponseData,
  MeResponseData,
  AuthState,
  CentaurAuthPluginOptions,
  PatientService,
  Patient,
  GeneralPatient,
  UrgencePatient,
  OncologiePatient,
  CardiologiePatient,
  PatientRow,
  GetPatientsResponseData,
} from './types';
