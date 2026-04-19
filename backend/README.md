# limpid Backend

Backend services for the limpid microplastics monitoring platform.

This repository now supports two backend runtime shapes:

- `local`: Fastify + Prisma + PostgreSQL
- `aws`: Lambda handlers + DynamoDB + S3 + Cognito JWT auth

The backend codebase still contains the original local server because it is the default development path, but the repository also includes the deployed AWS/serverless path used by the migration.

## Runtime Modes

### Local mode

Used when:

- `APP_RUNTIME=local`
- the process starts from `src/server.ts`
- data is stored in PostgreSQL through Prisma
- auth uses local JWT flows

Main files:

- [`src/server.ts`](./src/server.ts)
- [`src/app.ts`](./src/app.ts)
- [`src/routes/`](./src/routes)
- [`src/services/`](./src/services)
- [`prisma/schema.prisma`](./prisma/schema.prisma)

### AWS mode

Used when:

- `APP_RUNTIME=aws`
- the stack is deployed through [`template.yaml`](./template.yaml)
- data is stored in DynamoDB
- auth uses Cognito access tokens and JWT claims
- file uploads use S3 presigned URLs
- device ingest uses AWS IoT Core -> Lambda

Main files:

- [`template.yaml`](./template.yaml)
- [`src/aws/handlers/api.ts`](./src/aws/handlers/api.ts)
- [`src/aws/handlers/iotIngest.ts`](./src/aws/handlers/iotIngest.ts)
- [`src/aws/auth.ts`](./src/aws/auth.ts)
- [`src/aws/sampleRepository.ts`](./src/aws/sampleRepository.ts)
- [`src/aws/deviceRepository.ts`](./src/aws/deviceRepository.ts)
- [`src/aws/userProfileRepository.ts`](./src/aws/userProfileRepository.ts)

## Technology Stack

| Area | Local mode | AWS mode |
| --- | --- | --- |
| Runtime | Node.js 20 | Node.js 20 on Lambda |
| HTTP surface | Fastify 4 | API Gateway HTTP API |
| Data store | PostgreSQL 16 via Prisma | DynamoDB |
| Auth | JWT + bcrypt | Cognito JWT authorizer |
| Storage | local uploads or S3 | S3 |
| Validation | Zod | Zod |
| Tests | Vitest | Vitest |

## Project Structure

```text
backend/
├── prisma/                    # Local relational schema and seed data
├── src/
│   ├── app.ts                 # Fastify app composition (local runtime)
│   ├── server.ts              # Local backend entry point
│   ├── config.ts              # Shared env/runtime configuration
│   ├── lib/                   # Prisma helpers
│   ├── middleware/            # Local auth middleware
│   ├── plugins/               # Fastify plugins
│   ├── routes/                # Local REST route modules
│   ├── services/              # Local business logic
│   ├── storage/               # Local and S3 storage providers
│   ├── aws/                   # Lambda handlers, repos, Cognito auth
│   └── tests/                 # Vitest suite for local and AWS code paths
├── Dockerfile                 # Local container image
├── template.yaml              # AWS SAM infrastructure template
├── samconfig.toml             # Current deploy defaults for this repo checkout
└── package.json
```

## Scripts

```bash
npm run dev         # tsx watch src/server.ts
npm run build       # compile TypeScript to dist/
npm run start       # run built local server
npm run db:push     # push Prisma schema to local database
npm run db:migrate  # create/apply Prisma migration in dev
npm run db:seed     # seed demo local users/devices/samples
npm run db:studio   # open Prisma Studio
npm run test        # run Vitest once
npm run test:watch  # run Vitest in watch mode
```

## Environment Variables

Copy [`.env.example`](./.env.example) to `.env`.

### Core runtime settings

| Variable | Purpose | Default |
| --- | --- | --- |
| `APP_RUNTIME` | `local` or `aws` | `local` |
| `PORT` | Listen port for local Fastify mode | `3001` |
| `NODE_ENV` | Runtime environment | `development` |
| `CORS_ORIGINS` | Comma-separated allowed origins | empty |

### Local database and auth

| Variable | Purpose | Default |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string for local mode | `postgresql://postgres:postgres@localhost:5432/microplastics` |
| `JWT_SECRET` | Local JWT signing secret | dev fallback in `src/config.ts` |
| `JWT_EXPIRES_IN` | Local JWT lifetime | `7d` |

### Storage

| Variable | Purpose | Default |
| --- | --- | --- |
| `STORAGE_PROVIDER` | `local` or `s3` | `local` |
| `LOCAL_STORAGE_PATH` | Upload directory for local storage mode | `./uploads` |
| `AWS_REGION` | AWS region when using S3/DynamoDB outside Lambda | `us-east-1` |
| `AWS_S3_BUCKET` | S3 bucket name | `microplastics-samples` |
| `AWS_ACCESS_KEY_ID` | Optional explicit AWS credential | empty |
| `AWS_SECRET_ACCESS_KEY` | Optional explicit AWS credential | empty |
| `AWS_SESSION_TOKEN` | Required when using temporary AWS credentials outside Lambda | empty |

### DynamoDB and Cognito

| Variable | Purpose | Default |
| --- | --- | --- |
| `AWS_DDB_SAMPLES_TABLE` | Samples table name | `Samples` |
| `AWS_DDB_DEVICES_TABLE` | Devices table name | `Devices` |
| `AWS_DDB_USER_PROFILES_TABLE` | User profiles table name | `UserProfiles` |
| `AWS_DDB_AUDIT_LOGS_TABLE` | Audit logs table name | `AuditLogs` |
| `AWS_DDB_DEVICE_CAPTURED_AT_INDEX` | Device sample GSI | `deviceId-capturedAt-index` |
| `AWS_DDB_USER_CAPTURED_AT_INDEX` | User sample GSI | `createdByUserId-capturedAt-index` |
| `AWS_COGNITO_USER_POOL_ID` | Cognito user pool id | empty |
| `AWS_COGNITO_USER_POOL_CLIENT_ID` | Cognito app client id | empty |
| `AWS_COGNITO_GROUPS_CLAIM` | JWT claim used for group mapping | `cognito:groups` |

## Local Setup

```bash
cp .env.example .env
npm install
npm run db:push
npm run db:seed
npm run dev
```

If Postgres is not already running locally:

```bash
docker compose up -d db
```

Recommended local `.env` values:

```env
APP_RUNTIME=local
STORAGE_PROVIDER=local
```

## Local Docker

[`Dockerfile`](./Dockerfile) and the repo-level [`docker-compose.yml`](../docker-compose.yml) are for the local Fastify/Postgres path.

The backend container now defaults to:

```env
APP_RUNTIME=local
STORAGE_PROVIDER=local
LOCAL_STORAGE_PATH=./uploads
```

That means compose is for local development compatibility, not for reproducing the deployed AWS Lambda/API Gateway stack.

## AWS Deployment Notes

The AWS infrastructure is defined in [`template.yaml`](./template.yaml).

Important points from the current implementation:

- Lambda handlers are built from `dist/aws/...`, so `npm run build` must run before deploy.
- The SAM template sets `APP_RUNTIME=aws` and `STORAGE_PROVIDER=s3`.
- The template does not set `AWS_REGION` as a Lambda environment variable, because Lambda reserves that key.
- When running AWS-backed code outside Lambda with temporary credentials, `AWS_SESSION_TOKEN` must be present in addition to key and secret.
- The checked-in [`samconfig.toml`](./samconfig.toml) currently targets stack `microplastics-mvp` in `us-west-1`, but treat those values as environment-specific.

Deploy:

```bash
cd backend
npm install
npm run build
sam deploy --guided
```

## Data Model

### Local mode

The Prisma schema defines:

- `User`
- `Device`
- `Sample`
- `SampleTag`
- `AuditLog`

### AWS mode

The DynamoDB-backed path uses:

- `Samples`
- `Devices`
- `UserProfiles`
- `AuditLogs`

Important AWS behavior:

- `sampleId` is the DynamoDB partition key for samples.
- `deviceId` is the partition key for devices.
- Edge-ingested samples omit `createdByUserId` when there is no user identity, instead of storing a DynamoDB `NULL` value. This keeps the `createdByUserId-capturedAt-index` GSI valid for user-created samples while still allowing device ingest.
- Sample images are stored as object keys and resolved through signed S3 URLs.

## API Surface

### Local Fastify routes

Local mode exposes:

- `POST /auth/login`
- `POST /auth/register`
- `POST /ingest/*`
- `GET /samples`
- `GET /devices`
- `GET /stats/*`
- `GET /admin/*`

### AWS Lambda/API routes

AWS mode exposes:

- `GET /health`
- `GET /auth/me`
- `POST /auth/login`
- `POST /auth/register`
- `POST /uploads/presign`
- `GET /samples`
- `GET /samples/:id`
- `PATCH /samples/:id`
- `DELETE /samples/:id`
- `GET /samples/stats`
- `GET /samples/map`
- `GET /devices`
- `GET /devices/:id`
- `GET /devices/:id/samples`
- `PATCH /devices/:id`
- `GET /stats/overview`
- `GET /stats/timeseries`
- `GET /admin/users`
- `PATCH /admin/users/:id`
- `GET /admin/audit-log`
- `GET /admin/overview`

Important AWS auth behavior:

- `/auth/login` and `/auth/register` intentionally return `501` in AWS mode.
- The real login path in AWS mode is Cognito Hosted UI + PKCE from the frontend.

## Storage

Storage selection happens in [`src/storage/index.ts`](./src/storage/index.ts):

- [`localStorageProvider.ts`](./src/storage/localStorageProvider.ts): writes under `LOCAL_STORAGE_PATH`
- [`s3StorageProvider.ts`](./src/storage/s3StorageProvider.ts): signs upload/download URLs with AWS SDK v3

The S3 and DynamoDB clients now pass `AWS_SESSION_TOKEN` when explicit temporary credentials are provided outside Lambda.

## Testing

Tests live under [`src/tests/`](./src/tests).

Current coverage includes:

- local route smoke tests
- local auth and ingest validation
- AWS API handler tests
- AWS IoT ingest handler tests
- AWS sample repository regression coverage for the null `createdByUserId` / GSI write path

Run:

```bash
npm test
```

## Known Notes

- Local Fastify + Prisma still exists because it is the simplest contributor workflow.
- The AWS repositories use scans in some read paths for MVP simplicity.
- Admin role changes update the app profile record; they do not synchronize Cognito groups automatically.
- If you extend the API, keep `frontend/src/lib/api.ts` aligned with the route surface so the current fallback behavior stays intentional instead of accidental.
