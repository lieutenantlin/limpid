# limpid Frontend

Next.js frontend for the limpid microplastics monitoring platform.

Like the backend, the frontend now supports two runtime configurations:

- `local auth mode`: browser talks to the local Fastify API and uses local JWT login
- `cognito auth mode`: browser talks to the deployed AWS API and uses Cognito Hosted UI + PKCE

## Technology Stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 16 App Router |
| UI | React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Data fetching | TanStack Query |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Maps | Leaflet + React Leaflet |

## Project Structure

```text
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout and providers
│   │   ├── page.tsx                # Public landing page
│   │   ├── auth/callback/          # Cognito redirect completion
│   │   ├── login/                  # Login screen and hosted-login trigger
│   │   └── (app)/                  # Protected application routes
│   ├── components/
│   │   ├── auth/                   # Auth provider and route guard
│   │   ├── ui/                     # Shared UI primitives
│   │   └── app-shell.tsx           # Navigation chrome
│   └── lib/
│       ├── api.ts                  # Browser API client
│       ├── auth.ts                 # Local vs Cognito auth helpers
│       ├── types.ts                # Shared frontend types
│       └── utils.ts
├── Dockerfile
└── package.json
```

## Route Surface

| Route | Auth | Notes |
| --- | --- | --- |
| `/` | none | Public landing page |
| `/login` | none | Local login form or Cognito start screen |
| `/auth/callback` | none | Cognito code exchange completion |
| `/dashboard` | bearer | Overview and KPIs |
| `/samples` | bearer | Sample list |
| `/samples/[id]` | bearer | Sample detail |
| `/devices` | bearer | Device list |
| `/devices/[id]` | bearer | Device detail |
| `/map` | bearer | Map view |
| `/admin` | admin | User/admin tools |

## Auth Modes

### Local auth mode

Used when:

- `NEXT_PUBLIC_AUTH_MODE=local`
- the backend is the local Fastify API
- the login form submits email/password to `POST /auth/login`

Behavior:

- token is stored in browser storage
- `AuthProvider` seeds the current user in React Query
- protected routes rely on the stored local bearer token

### Cognito auth mode

Used when:

- `NEXT_PUBLIC_AUTH_MODE=cognito`
- `NEXT_PUBLIC_API_BASE_URL` points to the deployed API Gateway URL
- `NEXT_PUBLIC_COGNITO_*` values are set

Behavior:

- `/login` shows the Cognito hosted sign-in CTA instead of the local email/password form
- the app generates a PKCE verifier/challenge
- the browser is redirected to Cognito Hosted UI
- Cognito redirects back to `/auth/callback`
- the frontend exchanges the auth code for tokens and stores them in browser storage

Important implementation files:

- [`src/lib/auth.ts`](./src/lib/auth.ts)
- [`src/app/auth/callback/page.tsx`](./src/app/auth/callback/page.tsx)
- [`src/app/login/login-page-client.tsx`](./src/app/login/login-page-client.tsx)
- [`src/components/auth/auth-provider.tsx`](./src/components/auth/auth-provider.tsx)

## API Integration

The browser API client lives in [`src/lib/api.ts`](./src/lib/api.ts).

It:

- reads `NEXT_PUBLIC_API_BASE_URL`
- attaches `Authorization: Bearer ...` when a token exists
- clears local session state on `401`
- calls the live REST surface directly from the browser

Current AWS-aligned endpoints used by the frontend include:

- `GET /auth/me`
- `GET /samples`
- `GET /samples/stats`
- `GET /samples/map`
- `GET /devices`
- `GET /devices/:id`
- `GET /devices/:id/samples`
- `GET /admin/users`
- `GET /admin/audit-log`
- `GET /admin/overview`
- `POST /uploads/presign`

Fallback behavior still exists for a few routes:

- `getSampleStats()` can derive metrics from sample/device data
- `getSampleMarkers()` can fall back to sample list data
- `getDeviceSamples()` can fall back to filtered samples
- `getAdminOverview()` can derive summary counts from users and audit logs

That behavior is deliberate and keeps the frontend resilient while the API remains MVP-shaped.

## Environment Variables

Use [`.env.example`](./.env.example) as the template.

### Local auth mode example

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_AUTH_MODE=local
```

### Cognito auth mode example

```env
NEXT_PUBLIC_API_BASE_URL=https://YOUR_HTTP_API_ID.execute-api.YOUR_REGION.amazonaws.com
NEXT_PUBLIC_AUTH_MODE=cognito
NEXT_PUBLIC_COGNITO_DOMAIN=https://YOUR_DOMAIN.auth.YOUR_REGION.amazoncognito.com
NEXT_PUBLIC_COGNITO_CLIENT_ID=YOUR_COGNITO_APP_CLIENT_ID
NEXT_PUBLIC_COGNITO_REDIRECT_URI=http://localhost:3000/auth/callback
NEXT_PUBLIC_COGNITO_LOGOUT_URI=http://localhost:3000/login
NEXT_PUBLIC_COGNITO_SCOPE=openid email profile
```

Important Cognito note:

- The app client must have a managed login branding assigned, or Cognito can return `Login pages unavailable`.
- In the current AWS migration flow, the default managed-login style can be created with:

```bash
aws cognito-idp create-managed-login-branding \
  --user-pool-id YOUR_USER_POOL_ID \
  --client-id YOUR_CLIENT_ID \
  --use-cognito-provided-values
```

## Local Development

```bash
npm install
npm run dev
```

By default the app runs on `http://localhost:3000`.

Useful routes:

- `http://localhost:3000/`
- `http://localhost:3000/login`
- `http://localhost:3000/dashboard`

Before testing Cognito locally, make sure the Cognito app client callback and logout URLs include:

- `http://localhost:3000/auth/callback`
- `http://localhost:3000/login`

## Docker

[`Dockerfile`](./Dockerfile) now supports both local and Cognito-oriented public environment values at build time.

Build args supported by the frontend image:

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_AUTH_MODE`
- `NEXT_PUBLIC_COGNITO_DOMAIN`
- `NEXT_PUBLIC_COGNITO_CLIENT_ID`
- `NEXT_PUBLIC_COGNITO_REDIRECT_URI`
- `NEXT_PUBLIC_COGNITO_LOGOUT_URI`
- `NEXT_PUBLIC_COGNITO_SCOPE`

The repo-level [`docker-compose.yml`](../docker-compose.yml) still represents the local stack by default:

- frontend on `localhost:3000`
- local Fastify API on `localhost:3001`
- Postgres on `localhost:5432`

You can override the compose frontend environment if you want the containerized frontend to point at the deployed AWS API and Cognito, but compose still starts the local API and database unless you deliberately change the workflow.

## Validation

Useful checks for the AWS-backed frontend:

1. Open `/login`
2. Click `Continue to Cognito`
3. Complete hosted sign-in
4. Confirm redirect to `/dashboard`
5. Confirm `/auth/me` succeeds with the stored access token
6. Confirm `/devices` and `/samples` load
7. Confirm `POST /uploads/presign` returns an upload URL and object key

## Known Gaps

- No dedicated frontend tests are configured yet.
- Auth is browser-storage based, not SSR-session based.
- A few API routes still rely on fallback behavior in `src/lib/api.ts`.
- Running the newest Next.js version on AWS-native frontend hosting may require extra platform compatibility checks, which is why the current migration validates Cognito + API with the frontend running locally first.
