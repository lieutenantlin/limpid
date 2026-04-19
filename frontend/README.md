# Frontend

Next.js dashboard for the Aqua Graph microplastics monitoring platform.

## Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Next.js | 16 (App Router) |
| UI Library | React | 19 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| Components | shadcn/Base UI | - |
| State | TanStack Query | 5.x |
| Forms | React Hook Form + Zod | - |
| Charts | Recharts | - |
| Maps | Leaflet + React Leaflet | - |
| Icons | Lucide React | - |

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout, metadata, providers
│   │   ├── page.tsx            # Landing page
│   │   ├── login/
│   │   │   ├── page.tsx        # Login page wrapper
│   │   │   └── login-page-client.tsx  # Login form component
│   │   └── (app)/              # Protected route group
│   │       ├── layout.tsx      # App shell layout
│   │       ├── dashboard/
│   │       │   └── page.tsx    # Dashboard with KPIs & charts
│   │       ├── map/
│   │       │   └── page.tsx    # Interactive map view
│   │       ├── samples/
│   │       │   ├── page.tsx    # Sample list with filters
│   │       │   └── [id]/
│   │       │       └── page.tsx  # Sample detail view
│   │       ├── devices/
│   │       │   ├── page.tsx    # Device list
│   │       │   └── [id]/
│   │       │       └── page.tsx  # Device detail view
│   │       └── admin/
│   │           └── page.tsx   # Admin panel (admin only)
│   ├── components/
│   │   ├── ui/                 # shadcn/Base UI components
│   │   ├── auth/
│   │   │   ├── auth-provider.tsx   # Session management
│   │   │   └── auth-guard.tsx     # Route protection
│   │   ├── app-shell.tsx      # Sidebar, topbar, navigation
│   │   └── ...                 # Page-specific components
│   └── lib/
│       ├── api.ts             # API client with fallback logic
│       ├── auth.ts            # Token storage helpers
│       ├── types.ts           # TypeScript definitions
│       └── utils.ts           # Formatting utilities
├── Dockerfile
└── package.json
```

## Route Structure

| Route | Auth | Description |
|-------|------|-------------|
| `/` | None | Public landing page; redirects to `/dashboard` when a token already exists |
| `/login` | None | Login form |
| `/dashboard` | Bearer | Overview with KPIs & trends |
| `/map` | Bearer | Interactive map with markers |
| `/samples` | Bearer | Paginated sample list |
| `/samples/:id` | Bearer | Sample detail view |
| `/devices` | Bearer | Device list |
| `/devices/:id` | Bearer | Device detail view |
| `/admin` | Admin | User management & audit log |

## Data and auth model

The frontend is primarily a client-rendered app:

- it stores the JWT in `localStorage`
- all API calls are made from the browser
- authenticated routes depend on `AuthProvider` and `AuthGuard`
- TanStack Query caches user and data queries in memory

The public entry flow is:

1. anonymous visitors open `/` and see the landing page
2. landing page CTAs route to `/login`
3. returning users with a stored token are redirected from `/` to `/dashboard`

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
Use `http://localhost:3000/` for the public landing page and `http://localhost:3000/login` to test authentication directly.

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
