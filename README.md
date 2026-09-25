# Centaur Clinical Frontend

Vue 3 and TypeScript frontend for clinician authentication and viewing patient records by medical service. The UI uses TSX render functions, Vue Router, Axios, and Vue CLI. The repository also exposes the auth plugin and reusable views/components for integration into another Vue application.

## Requirements

- Node.js 20 or a compatible release for the Vue CLI 5 toolchain
- npm
- A reachable Centaur Clinical backend for interactive login and patient data. Unit tests do not require a backend.

## Install and Configure

```sh
npm install
```

Set `VUE_APP_API_URL` in a root `.env` file to the backend base URL. The supplied `.env.example` uses:

```dotenv
VUE_APP_API_URL=http://localhost:5000
```

If unset, the app and Axios client use `http://localhost:5000`. Vue CLI embeds `VUE_APP_*` values in the frontend build, so this is public client configuration, not a secret. The development server listens on port `8080` (configured in `vue.config.js`).

## Development and Production

Start the development server:

```sh
npm run serve
```

Open `http://localhost:8080`.

Run the TypeScript check and build the production bundle into `dist/`:

```sh
npm run type-check
npm run build
```

The Dockerfile builds the app with Node 20 and serves `dist/` through Nginx on container port 80. Docker Compose maps this to `${FRONT_PORT:-8080}` and passes `VUE_APP_API_URL` as a build argument. Nginx provides history-mode fallback and configures `/api/` proxying to `http://app:5000/api/`; the proxy requires a reachable Docker service named `app`. The browser API URL is compiled into the bundle at build time.

```sh
docker compose up -d --build
```

## Unit Tests

Run the Jest suite:

```sh
npm run test:unit -- --runInBand
```

The project uses `@vue/cli-plugin-unit-jest`, Vue Test Utils, and Jest with TypeScript/Babel transforms. Tests are under `tests/unit/`; they mock API behavior and do not contact a backend. The current Vue CLI Jest 27 preset uses `ts-jest` 27, which warns that TypeScript 5.3 is outside its tested version range even though the suite currently passes.

## Application Structure

The Vue CLI page entry is `example/main.tsx`; it installs the router and `CentaurAuth` plugin and mounts the example root app. `src/main.tsx` is an alternate app entry with the same root shell and router.

| Location | Responsibility |
| --- | --- |
| `example/App.tsx` | Root layout: `Navbar`, `RouterView`, and footer. |
| `example/router.ts` | HTML5 history router built from `defaultAuthRoutes`; updates document titles after navigation. |
| `src/views/LoginView.tsx` | Hosts `LoginForm` and redirects after login, honoring `?redirect=` when present. |
| `src/components/LoginForm.tsx` | Credential inputs, required-field validation, password visibility, submission state, and error display. |
| `src/components/Navbar.tsx` | Displays signed-in user or Guest state; logout clears auth and navigates to Login. |
| `src/views/PatientsView.tsx` | Coordinates service selection, tabs, refresh, errors, and patient data loading. |
| `src/components/PatientServiceTab.tsx` | Patient service tab button, count/active state, and service-specific SVG icon. |
| `src/components/PatientTable.tsx` | Loading/empty states and common and service-specific patient rows. |
| `src/composables/use-patients.ts` | Fetches patients, tracks loading/errors, and logs out/navigates to Login after HTTP 401. |
| `src/api/` | Typed Axios wrappers for authentication and patients plus the shared HTTP client. |
| `src/auth/` | `AuthService`, `TokenStorageService`, and `useAuth()` for auth state and token storage. |
| `src/router/` | Route records and the authentication navigation guard. |
| `src/plugin/index.ts` | Composes and installs the `CentaurAuth` Vue plugin. |
| `src/types/index.ts` | Auth, API, and patient TypeScript types. |
| `src/styles/index.css` | Shared design tokens, layout, controls, and patient-page styles. |
| `tests/unit/` | Jest tests for authentication/routing, patient tabs, APIs, and token persistence. |

Components use Vue 3 `defineComponent` with TypeScript JSX rather than `.vue` single-file components. `PatientServiceTab` and `PatientTable` isolate patient-specific presentation from the page coordinator; auth and API behavior live in their own services/composable.

## Routes and Authentication

`src/router/routes.ts` defines:

| Path | Behavior |
| --- | --- |
| `/` | Redirects to `/patients`. |
| `/login` | Guest-only login page; authenticated users redirect to `/patients`. |
| `/patients` | Protected patient list; unauthenticated users redirect to `/login`, preserving the requested destination in `?redirect=...`. |

`setupAuthGuard` installs the global navigation guard. Its `requiresAuth` check uses `AuthService.isAuthenticated`, initialized from whether an access token exists in storage; the guard itself does not validate a JWT with the backend. A rejected or expired token is detected when a protected API call returns HTTP 401, at which point `usePatients()` logs out and redirects to Login.

After successful login, `LoginView` navigates to the `redirect` query destination or `/patients` by default. `Navbar` calls `logout()` and then navigates to `/login`.

## Token Handling

`TokenStorageService` stores the access token, refresh token, and serialized user profile in browser `localStorage`, with an in-memory fallback when local storage is unavailable. The default key prefix is `centaur_auth_`; the plugin accepts a custom `storageKeyPrefix`. These are client-side tokens, not HttpOnly cookies.

On successful login, `AuthService` stores the returned tokens and profile and updates reactive state. `refreshTokens()` sends the stored refresh token to the backend and replaces the session on success. `logout()` attempts server-side revocation, then clears local state and storage even if that request fails.

The Axios request interceptor adds `Authorization: Bearer <access_token>` when a token is available. `PatientApi.getPatientsByService()` can also add an explicit Bearer token header; `usePatients()` passes the current access token.

## Backend API

`src/api/client.ts` creates the Axios client with the configured base URL, JSON content type, a 10-second timeout, and the Bearer token request interceptor. The API wrappers use these endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Submit `{ username, password }`; response contains user and access/refresh tokens. |
| `GET` | `/api/auth/me` | Fetch the current user profile. |
| `POST` | `/api/auth/refresh` | Submit `{ refreshToken }` to refresh session credentials. |
| `POST` | `/api/auth/logout` | Submit `{ refreshToken }` for server-side revocation. |
| `GET` | `/api/patients?service=<service>` | Fetch patient records for one service. |

The development server does not configure an API proxy. For local development the backend must be reachable at `VUE_APP_API_URL` and permit the browser origin according to its CORS policy.

## Patients Page

`PatientsView` loads the `general` service on mount. Selecting Général, Urgence, Oncologie, or Cardiologie changes the active tab and requests that service's patient list. The active tab shows a count or loading indicator; the refresh button reloads the selected service.

`PatientTable` displays common identity and hospitalization-date fields plus service-specific data: arrival time, triage level, and initial severity for Urgence; tumor type, stage, and treatment for Oncologie; ECG result, resting heart rate, and blood pressure for Cardiologie. ISO date-time values are displayed as `YYYY-MM-DD`. The supported service IDs are `general`, `urgence`, `oncologie`, and `cardiologie`.

## Plugin Integration

`src/index.ts` exports `CentaurAuth`/`createCentaurAuth`, auth helpers and APIs, patient APIs, route records/guard helpers, `LoginForm`, `Navbar`, `LoginView`, `PatientsView`, and public types. Install `createCentaurAuth({ apiUrl, router })` in a Vue app to provide auth state and install route protection. `example/README.md` contains an integration example.
