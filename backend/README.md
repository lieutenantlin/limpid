# limpid Backend

Fastify + Prisma API for the limpid microplastics monitoring platform.

## Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Runtime | Node.js | 20.x |
| HTTP Server | Fastify | 4.x |
| Language | TypeScript | 5.x |
| ORM | Prisma | latest |
| Database | PostgreSQL | 16.x |
| Validation | Zod | latest |
| Auth | JWT + bcrypt | - |
| Testing | Vitest | latest |

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Demo data
├── src/
│   ├── app.ts              # Fastify instance composition
│   ├── server.ts           # Entry point, graceful shutdown
│   ├── config.ts           # Environment variables
│   ├── lib/
│   │   └── prisma.ts       # Prisma client singleton
│   ├── plugins/            # @fastify/cors, @fastify/sensible
│   ├── middleware/
│   │   └── authenticate.ts # JWT auth & role authorization
│   ├── routes/             # API endpoints
│   │   ├── health.ts       # Health checks
│   │   ├── auth.ts         # Authentication
│   │   ├── ingest.ts       # Device data ingestion
│   │   ├── samples.ts      # Sample CRUD
│   │   ├── devices.ts      # Device CRUD
│   │   ├── stats.ts        # Analytics endpoints
│   │   └── admin.ts        # Admin operations
│   ├── services/           # Business logic
│   │   ├── authService.ts      # JWT & password handling
│   │   ├── deviceService.ts   # Device management
│   │   ├── sampleService.ts   # Sample operations
│   │   └── auditService.ts    # Audit logging
│   ├── storage/            # Storage abstraction
│   │   ├── storageInterface.ts
│   │   ├── localStorageProvider.ts
│   │   └── s3StorageProvider.ts
│   └── tests/              # Vitest test suite
├── Dockerfile
└── package.json
```

## Entry Points

| File | Purpose |
|------|---------|
| [`src/server.ts`](src/server.ts) | Process bootstrap, signal handling, graceful shutdown |
| [`src/app.ts`](src/app.ts) | Fastify app factory, plugin and route registration |
| [`prisma/schema.prisma`](prisma/schema.prisma) | Relational schema definition |
| [`prisma/seed.ts`](prisma/seed.ts) | Demo data generation |

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

Copy [`.env.example`](.env.example) to `.env`.

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

## API Endpoints

### Health Check
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | None | Returns app and database health status |

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | None | Register a new user |
| POST | `/auth/login` | None | Login, returns JWT token |
| POST | `/auth/logout` | Bearer | Invalidate session |
| GET | `/auth/me` | Bearer | Get current user info |

### Device Ingestion (No Auth - Device Trust)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/ingest/sample` | None | Ingest single sample from edge device |
| POST | `/ingest/batch` | None | Ingest multiple samples (up to 100) |
| POST | `/ingest/device-heartbeat` | None | Update device status and version |

**Ingest Request Schema:**
```json
{
  "sampleId": "uuid",
  "deviceId": "unoq-001",
  "capturedAt": "2026-04-18T14:22:31Z",
  "location": { "lat": 32.68, "lng": -117.18 },
  "microplasticEstimate": 12.4,
  "unit": "particles_per_ml",
  "confidence": 0.87,
  "modelVersion": "v1.3.0",
  "qualityScore": 0.79,
  "notes": "harbor edge sample",
  "imageObjectKey": "samples/2026/04/18/uuid.jpg",
  "thumbnailObjectKey": "samples/2026/04/18/uuid-thumb.jpg"
}
```

### Samples (Authenticated)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/samples` | Bearer | List samples with pagination & filters |
| GET | `/samples/:id` | Bearer | Get sample detail with signed image URLs |
| PATCH | `/samples/:id` | researcher+ | Update sample notes/tags |
| DELETE | `/samples/:id` | admin | Delete a sample |

**Query Parameters for `/samples`:**
- `deviceId` - Filter by device
- `source` - Filter by source (edge, manual, imported)
- `from` / `to` - Date range filter
- `page` / `limit` - Pagination (default: 20, max: 100)

### Devices (Authenticated)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/devices` | researcher+ | List all devices |
| GET | `/devices/:id` | Bearer | Get device details |
| PATCH | `/devices/:id` | admin | Update device label/status |

### Statistics (Authenticated)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/stats/overview` | Bearer | Dashboard overview metrics |
| GET | `/stats/by-device` | Bearer | Samples grouped by device |
| GET | `/stats/timeseries` | Bearer | Time-series data with interval |

**Query Parameters for `/stats/timeseries`:**
- `from` / `to` - Date range
- `interval` - Aggregation interval (day, week)

### Administration (Admin Only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/users` | List all users |
| PATCH | `/admin/users/:id` | Update user role |
| DELETE | `/admin/users/:id` | Delete user |
| GET | `/admin/audit-log` | Query audit logs with filters |

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

Storage is selected in [`src/storage/index.ts`](src/storage/index.ts):

- `localStorageProvider.ts`: writes files under `LOCAL_STORAGE_PATH`
- `s3StorageProvider.ts`: uses AWS SDK v3 to create signed download URLs

Sample records store `imageObjectKey` and `thumbnailObjectKey`; signed URLs are resolved when loading sample detail.

## Testing

Tests live under [`src/tests/`](src/tests/).

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
