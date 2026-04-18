# Backend

Fastify + Prisma API for the Aqua Graph microplastics monitoring app.

## Stack

- Fastify 4 for the HTTP server
- TypeScript compiled with `tsc`
- Prisma for PostgreSQL access
- Zod for request validation
- JWT bearer auth
- `bcrypt` password hashing
- Local filesystem or S3-compatible object storage abstraction
- Vitest for route-level tests

## Entry points

- [`src/server.ts`](/home/mori/Dev/datahacks-2026/lobotomite-frontal-27/backend/src/server.ts): process bootstrap and graceful shutdown
- [`src/app.ts`](/home/mori/Dev/datahacks-2026/lobotomite-frontal-27/backend/src/app.ts): Fastify app composition
- [`prisma/schema.prisma`](/home/mori/Dev/datahacks-2026/lobotomite-frontal-27/backend/prisma/schema.prisma): relational schema
- [`prisma/seed.ts`](/home/mori/Dev/datahacks-2026/lobotomite-frontal-27/backend/prisma/seed.ts): local seed data and demo users

## Scripts

```bash
npm run dev         # tsx watch src/server.ts
npm run build       # compile TypeScript to dist/
npm run start       # run built server
npm run db:push     # push Prisma schema to the database
npm run db:migrate  # create and apply Prisma migration in dev
npm run db:seed     # seed demo users/devices/samples
npm run db:studio   # open Prisma Studio
npm run test        # run Vitest once
npm run test:watch  # run Vitest in watch mode
```

## Environment variables

Copy [`.env.example`](/home/mori/Dev/datahacks-2026/lobotomite-frontal-27/backend/.env.example) to `.env`.

| Variable | Purpose | Default |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/microplastics` |
| `JWT_SECRET` | Secret used to sign and verify JWTs | dev default in `src/config.ts` |
| `JWT_EXPIRES_IN` | Token lifetime | `7d` |
| `PORT` | Fastify listen port | `3001` |
| `NODE_ENV` | Runtime environment | `development` |
| `STORAGE_PROVIDER` | `local` or `s3` | `local` |
| `LOCAL_STORAGE_PATH` | Upload directory when using local storage | `./uploads` |
| `AWS_REGION` | S3 region | `us-east-1` |
| `AWS_S3_BUCKET` | S3 bucket name | `microplastics-samples` |
| `AWS_ACCESS_KEY_ID` | S3 credentials | empty |
| `AWS_SECRET_ACCESS_KEY` | S3 credentials | empty |

## Local setup

```bash
cp .env.example .env
npm install
npm run db:push
npm run db:seed
npm run dev
```

If Postgres is not already running locally, start it from the repo root with:

```bash
docker compose up -d db
```

## Data model

The Prisma schema defines these main entities:

- `User`: application accounts with roles `admin`, `researcher`, or `viewer`
- `Device`: edge hardware registry with status, versions, and heartbeat timestamps
- `Sample`: captured microplastics measurements with location, confidence, model metadata, and optional image keys
- `SampleTag`: normalized tags attached to samples
- `AuditLog`: append-only audit events for auth and admin actions

Key modeling decisions:

- `Sample.sampleId` is the external idempotency key for ingest
- `Device.deviceId` is the external hardware identifier
- image assets are not stored in the database, only object keys are
- roles are enforced at the route layer through JWT middleware

## Route groups

### Public or device-facing ingest routes

- `POST /ingest/sample`
- `POST /ingest/batch`
- `POST /ingest/device-heartbeat`

These endpoints validate payloads with Zod and write audit entries. Devices are auto-created on first ingest or heartbeat.

### Auth routes

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

Passwords are hashed with `bcrypt`. JWTs are signed in `src/services/authService.ts` and enforced by `src/middleware/authenticate.ts`.

### Protected app routes

- `GET /samples`
- `GET /samples/:id`
- `PATCH /samples/:id`
- `DELETE /samples/:id`
- `GET /devices`
- `GET /devices/:id`
- `PATCH /devices/:id`
- `GET /stats/overview`
- `GET /stats/by-device`
- `GET /stats/timeseries`
- `GET /admin/users`
- `PATCH /admin/users/:id`
- `DELETE /admin/users/:id`
- `GET /admin/audit-log`

## Auth and authorization

The backend uses stateless bearer auth:

- the client sends `Authorization: Bearer <token>`
- `authenticate()` verifies and attaches the JWT payload
- `requireRole()` wraps `authenticate()` and blocks users without the required role

Current route policy, at a high level:

- `viewer`: can access authenticated read routes that only require `authenticate`
- `researcher`: can read devices and update samples
- `admin`: can manage users, update devices, and delete samples

## Storage

Storage is selected in [`src/storage/index.ts`](/home/mori/Dev/datahacks-2026/lobotomite-frontal-27/backend/src/storage/index.ts):

- `localStorageProvider.ts`: writes files under `LOCAL_STORAGE_PATH`
- `s3StorageProvider.ts`: uses AWS SDK v3 to create signed download URLs

Sample records store `imageObjectKey` and `thumbnailObjectKey`; signed URLs are resolved when loading sample detail.

## Testing

Tests live under [`src/tests/`](/home/mori/Dev/datahacks-2026/lobotomite-frontal-27/backend/src/tests).

Current coverage is route-focused and mostly uses mocked Prisma dependencies:

- health endpoint smoke test
- auth validation and auth failure cases
- ingest validation and basic success path

What is not covered yet:

- database-backed integration tests
- role/permission matrix tests
- stats query correctness against realistic data
- storage provider behavior

## Known integration notes

The frontend currently contains fallbacks for some API capabilities that are not directly exposed by backend routes yet, including sample stats and map-marker specific endpoints. If you extend the API, align it with `frontend/src/lib/api.ts` or remove the fallback logic there.
