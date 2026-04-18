# Frontend

Next.js dashboard for the Aqua Graph microplastics monitoring system.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/Base UI components
- TanStack Query for client-side data fetching
- React Hook Form + Zod for forms
- Recharts for charts
- Leaflet + React Leaflet for geospatial views
- Lucide icons

## App structure

### Route layout

- `src/app/layout.tsx`: root layout, metadata, and global providers
- `src/app/page.tsx`: top-level entry page
- `src/app/login/*`: login route
- `src/app/(app)/*`: authenticated application routes wrapped in the app shell

Protected routes currently include:

- `/dashboard`
- `/map`
- `/samples`
- `/samples/[id]`
- `/devices`
- `/devices/[id]`
- `/admin`

### Shared client infrastructure

- `src/components/providers.tsx`: creates the shared TanStack Query client
- `src/components/auth/auth-provider.tsx`: session management and `auth/me` query
- `src/components/auth/auth-guard.tsx`: redirects unauthenticated users to login
- `src/components/app-shell.tsx`: sidebar, top bar, role-aware navigation, logout flow
- `src/lib/api.ts`: fetch wrapper and API surface used by pages
- `src/lib/auth.ts`: local storage token helpers

## Data and auth model

The frontend is primarily a client-rendered app:

- it stores the JWT in `localStorage`
- all API calls are made from the browser
- authenticated routes depend on `AuthProvider` and `AuthGuard`
- TanStack Query caches user and data queries in memory

The login flow is:

1. submit credentials from `login-page-client.tsx`
2. call `POST /auth/login`
3. store the returned token in local storage
4. seed the current user into the React Query cache
5. redirect to `/dashboard`

## Styling and UI

Styling is centered around [`src/app/globals.css`](/home/mori/Dev/datahacks-2026/lobotomite-frontal-27/frontend/src/app/globals.css):

- Tailwind CSS 4 with CSS variables and custom tokens
- a custom Aqua Graph visual theme using OKLCH color tokens
- shadcn's generated utility and primitive component setup
- glassy panel surfaces through the shared `.surface` utility

UI building blocks live in `src/components/ui/`. The app also uses:

- Recharts for KPI and trend visualizations
- React Leaflet for sample mapping
- responsive sheet navigation for mobile

## API integration

The frontend assumes the backend is available at:

- `NEXT_PUBLIC_API_BASE_URL`, if set
- otherwise `http://localhost:3001`

The API wrapper:

- attaches `Authorization` automatically when a token exists
- clears the stored token on `401`
- throws typed request errors

There are also deliberate fallback paths in `src/lib/api.ts`:

- `getSampleStats()` derives dashboard metrics from sample and device lists if a dedicated stats endpoint is unavailable
- `getSampleMarkers()` falls back to sample list data if a map endpoint is unavailable
- `getDeviceSamples()` and `getAdminOverview()` similarly degrade gracefully

This is useful in development, but it also means some frontend behavior is compensating for incomplete backend route parity.

## Local development

```bash
npm install
npm run dev
```

By default the app runs on `http://localhost:3000`.

To point at a non-default backend, set:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

## Important dependencies

| Package | Role |
| --- | --- |
| `next` | application runtime and routing |
| `@tanstack/react-query` | client-side server state |
| `react-hook-form` + `@hookform/resolvers` | forms |
| `zod` | validation |
| `recharts` | charts |
| `leaflet` + `react-leaflet` | maps |
| `@base-ui/react` | lower-level UI primitives |
| `shadcn` | generated component workflow |

## Gaps worth knowing

- There are no frontend tests configured yet.
- The app depends on browser storage for auth, so it is not using SSR-auth patterns.
- A few backend route names and response shapes are still in flux, which is why the API client includes fallbacks.
