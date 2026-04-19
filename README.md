# limpid

Microplastics monitoring platform built for DataHacks 2026. The repository contains:

- `backend/`: a Fastify API backed by PostgreSQL via Prisma
- `frontend/`: a Next.js app with a public landing page plus authenticated researcher/admin dashboards

The product in the codebase is "limpid": devices ingest sample measurements, the API stores them, and the frontend visualizes them in dashboards, tables, and a map.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                             limpid Platform                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────────────┐     │
│  │   iPhone    │    │  Arduino UNO │    │      Backend API        │     │
│  │   (Camera)  │───▶│  (Edge AI)   │───▶│   (Fastify + Prisma)    │     │
│  └─────────────┘    └──────────────┘    └───────────────┬─────────┘     │
│                                                         │               │
│                                                         ▼               │
│                                              ┌─────────────────────┐    │
│                                              │   PostgreSQL DB     │    │
│                                              │   (Prisma ORM)      │    │
│                                              └─────────────────────┘    │
│                                                                         │
│                                              ┌─────────────────────┐    │
│                                              │   Storage Layer     │    │
│                                              │   (Local or S3)     │    │
│                                              └─────────────────────┘    │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                         Frontend (Next.js)                      │   │
│   │  ┌──────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────────┐   │   │
│   │  │Dashboard │ │  Map   │ │Samples │ │Devices │ │   Admin    │   │   │
│   │  └──────────┘ └────────┘ └────────┘ └────────┘ └────────────┘   │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

1. **Ingest**: Edge devices (Arduino + iPhone) send sample payloads to `/ingest/*` endpoints
2. **Store**: API validates payloads with Zod, Prisma persists to PostgreSQL
3. **Display**: Frontend fetches data via TanStack Query and visualizes in dashboards/maps

## Tech Stack

### Frontend (Built)

| Technology | Purpose |
|------------|---------|
| Next.js 16 | App Router, server-side rendering |
| React 19 | UI framework |
| TypeScript | Type safety |
| Tailwind CSS 4 | Styling with custom OKLCH theme |
| shadcn/Base UI | Component primitives |
| TanStack Query | Server state management |
| React Hook Form + Zod | Form handling and validation |
| Recharts | Dashboard charts |
| Leaflet + React Leaflet | Map rendering |
| Lucide React | Icon library |

### Backend

| Technology | Purpose |
|------------|---------|
| Node.js 20 | Runtime |
| Fastify 4 | HTTP server |
| TypeScript | Type safety |
| Prisma ORM | Database access |
| PostgreSQL 16 | Database |
| Zod | Request validation |
| JWT + bcrypt | Authentication |
| Vitest | Testing |

### Infrastructure

| Technology | Purpose |
|------------|---------|
| Docker Compose | Local orchestration |
| Docker | Containerization |
| Multi-stage builds | Optimized images |

## Architecture

### Backend flow

1. Edge devices send sample payloads to `/ingest/sample` or `/ingest/batch`.
2. The API validates payloads with Zod.
3. Prisma persists `Device`, `Sample`, `SampleTag`, `User`, and `AuditLog` records in PostgreSQL.
4. Image references are stored as object keys; download URLs are resolved through the configured storage provider.
5. Authenticated users access samples, devices, stats, and admin operations through JWT-protected routes.

### Frontend flow

1. Unauthenticated visitors land on `/`, which serves the public landing page.
2. If a JWT is already stored in browser local storage, the landing page redirects the user to `/dashboard`.
3. Users authenticate against `POST /auth/login`.
4. TanStack Query fetches API data from the client and caches responses.
5. Protected pages under `src/app/(app)` are wrapped in an auth guard and shared app shell.
6. Dashboard, sample, device, map, and admin screens are rendered from API data.

## Repository Layout

```
├── backend/                  # Fastify API server
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── seed.ts          # Demo data
│   ├── src/
│   │   ├── app.ts           # Fastify app composition
│   │   ├── server.ts        # Entry point
│   │   ├── config.ts        # Environment configuration
│   │   ├── lib/
│   │   │   └── prisma.ts    # Prisma client singleton
│   │   ├── plugins/         # CORS, sensible
│   │   ├── middleware/
│   │   │   └── authenticate.ts  # JWT auth & role guards
│   │   ├── routes/          # API route modules
│   │   │   ├── health.ts    # GET /health
│   │   │   ├── auth.ts      # POST /auth/*, GET /auth/me
│   │   │   ├── ingest.ts    # POST /ingest/*
│   │   │   ├── samples.ts   # CRUD /samples
│   │   │   ├── devices.ts   # CRUD /devices
│   │   │   ├── stats.ts     # GET /stats/*
│   │   │   └── admin.ts     # Admin user/audit routes
│   │   ├── services/        # Business logic
│   │   ├── storage/         # Storage abstraction (local/S3)
│   │   └── tests/           # Vitest tests
│   ├── Dockerfile
│   └── package.json
├── frontend/                # Next.js dashboard
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   │   ├── layout.tsx   # Root layout
│   │   │   ├── page.tsx    # Landing page
│   │   │   ├── login/       # Login flow
│   │   │   └── (app)/       # Protected routes
│   │   │       ├── dashboard/
│   │   │       ├── map/
│   │   │       ├── samples/
│   │   │       ├── devices/
│   │   │       └── admin/
│   │   ├── components/      # React components
│   │   │   ├── ui/          # shadcn components
│   │   │   ├── auth/        # Auth guards & providers
│   │   │   ├── app-shell.tsx
│   │   │   └── ...
│   │   └── lib/             # API client, types, utils
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml        # Full stack orchestration
├── landing.html             # Static landing page reference/mockup
├── README.md                # This file
├── backend_spec.md          # Backend requirements
├── frontend_spec.md         # Frontend requirements
└── CLAUDE.md                # Claude Code guidance
```

## Local development

### 1. Start PostgreSQL

From the repository root:

```bash
docker compose up -d db
```

### 2. Run the backend

```bash
cd backend
cp .env.example .env
npm install
npm run db:push
npm run db:seed
npm run dev
```

The backend listens on `http://localhost:3001` by default.

### 3. Run the frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:3000` by default and targets `http://localhost:3001` unless `NEXT_PUBLIC_API_BASE_URL` is set.
Visit `http://localhost:3000/` for the public landing page, `http://localhost:3000/login` for the auth flow, and `http://localhost:3000/dashboard` after sign-in.

## Docker workflow

The provided [`docker-compose.yml`](docker-compose.yml) now starts:

- `db`: Postgres 16 with a persistent named volume
- `api`: the Fastify backend on `http://localhost:3001`
- `frontend`: the Next.js app on `http://localhost:3000`

Start the full stack from the repository root:

```bash
docker compose up --build
```

Start it in the background:

```bash
docker compose up -d --build
```

Stop it:

```bash
docker compose down
```

Persist the database and uploaded files:

```bash
docker compose down
docker volume ls
```

Important detail: the frontend is a browser app, so its `NEXT_PUBLIC_API_BASE_URL` must point to a host-reachable address. In this compose setup it is intentionally set to `http://localhost:3001`, not `http://api:3001`, because the user's browser cannot resolve Docker's internal service DNS.

If you need database schema and seed data after the containers are up, run:

```bash
cd backend
npm install
npm run db:push
npm run db:seed
```

## Seed credentials

The seed script creates:

- `admin@example.com` / `admin1234`
- `researcher@example.com` / `researcher1234`

## Current API/frontend alignment notes

The frontend client contains fallback logic for a few endpoints that are not fully aligned with the backend route surface yet. Examples include:

- dashboard stats falling back to derived client-side calculations
- map markers falling back to the paginated samples list
- admin audit log handling both `/admin/audit-log` and `/admin/audit-logs`

That means the application is resilient during development, but the docs should be read as describing the current implementation, not a finished public API contract.
