# Centaur Clinical — Frontend Authentication Application

A clean, modern, and production-ready frontend for the **Centaur Clinical Authentication Backend**.

Built with **Vue.js 3**, **TypeScript (ES2015+)**, **JSX / TSX component model** (no Single File Components), **Axios**, and **Webpack (via Vue CLI)**. Fully Dockerized and decoupled from the backend for deployment in its own repository.

---

## 🚀 Key Features & Highlights

- **Pure JSX / TSX Architecture**: No `.vue` Single File Components; views and components are built with typed JSX render functions and Vue 3 Composition API (`defineComponent`).
- **Strict TypeScript**: Complete type safety with zero `any` usage. Comprehensive typings for user profiles, tokens, credentials, and API responses.
- **Centralized Route Protection**: Global navigation guards protecting routes via `meta.requiresAuth: true` and restricting public pages with `meta.guestOnly: true`. Preserves destination redirects (`?redirect=...`).
- **Token Management**: Secure access and refresh token lifecycle management with persistent storage and automatic Axios Bearer token injection.
- **Backend Integration**: Pre-configured to communicate with the Express JWT backend (`/api/auth/login`, `/api/auth/me`, `/api/auth/refresh`, `/api/auth/logout`).
- **Modern Clinical Aesthetics**: Sophisticated dark-mode clinical UI featuring glassmorphism, responsive cards, micro-animations, and feedback alerts.
- **Standalone Integration Example**: Dedicated `example/` folder showing how to consume and register the authentication plugin in any Vue 3 project.
- **Docker & Compose**: Production-ready multi-stage Docker build served via high-performance Nginx with SPA routing support.

---

## 📁 Project Structure

```
CentaurClinicalDZ-front/
├── .dockerignore              # Docker build exclusions
├── .env                       # Local environment variables
├── .env.example               # Template environment configuration
├── Dockerfile                 # Multi-stage production build (Node.js -> Nginx Alpine)
├── docker-compose.yml         # Container orchestration configuration
├── nginx.conf                 # Nginx SPA history fallback and API reverse proxy
├── babel.config.js            # Babel preset + @vue/babel-plugin-jsx
├── package.json               # Dependencies and scripts
├── tsconfig.json              # Strict TypeScript compiler options
├── vue.config.js              # Webpack / Vue CLI configuration
├── public/
│   └── index.html             # HTML template with Google Fonts (Plus Jakarta Sans)
├── src/
│   ├── api/
│   │   ├── client.ts          # Axios instance with Bearer interceptors
│   │   ├── auth.api.ts        # Typed API service for auth endpoints
│   │   └── patient.api.ts     # Typed API service for patient endpoints (GET /api/patients)
│   ├── auth/
│   │   ├── auth.service.ts    # Core reactive authentication service
│   │   ├── storage.service.ts # Token persistence abstraction (localStorage fallback)
│   │   └── use-auth.ts        # Composition API hook useAuth()
│   ├── components/
│   │   ├── LoginForm.tsx      # JSX login form component with validation
│   │   └── Navbar.tsx         # JSX navbar with user status pill and logout button
│   ├── views/
│   │   ├── LoginView.tsx      # JSX Login page view
│   │   ├── PatientsView.tsx   # JSX Patients List page view (4 tabs: Général, Urgence, etc.)
│   ├── router/
│   │   ├── guard.ts           # Centralized navigation guard (createAuthGuard)
│   │   └── routes.ts          # Standard auth route definitions (/login, /patients)
│   ├── plugin/
│   │   └── index.ts           # Vue 3 plugin (CentaurAuth / createCentaurAuth)
│   ├── styles/
│   │   └── index.css          # Design system, tokens, and clinical theme
│   ├── types/
│   │   └── index.ts           # Strict TypeScript interfaces and types
│   ├── index.ts               # Library entry point exporting all modules
│   └── main.tsx               # Standard application entry point
└── example/
    ├── App.tsx                # Example root layout with Navbar & RouterView
    ├── router.ts              # Example router configuration
    ├── main.tsx               # Example entry point consuming the auth plugin
    └── README.md              # Guide on consuming the plugin
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **Vue.js 3** | Progressive UI framework with Composition API |
| **TypeScript** | Strict ES2015+ static typing |
| **JSX / TSX** | Functional component templating (`@vue/babel-plugin-jsx`) |
| **Vue Router 4** | Client-side routing with centralized navigation guards |
| **Axios** | HTTP client with automatic Authorization header injection |
| **Webpack 5** | Bundler via Vue CLI (`@vue/cli-service`) |
| **Nginx Alpine** | Ultra-lightweight container web server for production |
| **Docker** | Containerization and orchestration |

---

## 💻 Local Development

### 1. Prerequisites
- Node.js >= 18 (Tested on v20.17.0)
- npm >= 9

### 2. Installation
```bash
cd CentaurClinicalDZ-front
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env` (already done by default):
```ini
VUE_APP_API_URL=http://localhost:5000
```

### 4. Running the Dev Server
```bash
npm run serve
```
The application will be available at `http://localhost:8080`.

### 5. Type Checking & Production Build
```bash
# Type check without emitting files
npm run type-check

# Compile production bundle to /dist
npm run build
```

---

## 🐳 Docker Deployment

### 1. Build and Run via Docker Compose
To run the frontend container:
```bash
docker-compose up -d --build
```
The frontend is mapped to `http://localhost:8080`.

### 2. Communicating with the Backend
- **Browser-to-Host**: When running locally or via Docker Compose, API requests from the user's browser point to `http://localhost:5000` (where the backend publishes its port).
- **Nginx Reverse Proxy**: `nginx.conf` also includes an internal reverse proxy at `/api/` routing to `http://app:5000/api/` when running inside a shared Docker network.
- **CORS Protection**: The backend accepts requests from `http://localhost:8080` and `http://localhost:3000` configured via `CORS_ORIGIN` in backend `.env`.

---

## 🔐 Route Protection & Navigation Guard

The router guard automatically manages page access:
- **Protected routes** (`meta: { requiresAuth: true }`):
  - Accessible only if a valid JWT token exists.
  - Unauthenticated access redirects to `/login?redirect=<intended_path>`.
- **Public / Guest routes** (`meta: { guestOnly: true }`):
  - If an authenticated user navigates to `/login`, they are redirected to `/patients`.

---

## 🧩 Consuming the Auth Plugin (Example)

See the `example/` directory for full code:

```typescript
import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import { createCentaurAuth, defaultAuthRoutes } from './src';
import App from './example/App';

const router = createRouter({
  history: createWebHistory(),
  routes: [...defaultAuthRoutes],
});

const app = createApp(App);

app.use(router);
app.use(createCentaurAuth({
  apiUrl: process.env.VUE_APP_API_URL || 'http://localhost:5000',
  router, // Enables automatic navigation guard setup
}));

app.mount('#app');
```
