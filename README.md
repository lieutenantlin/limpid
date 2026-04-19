# limpid

Microplastics monitoring platform built for DataHacks 2026.

This repository now supports two backend/runtime shapes:

- `Local development mode`: Next.js frontend + Fastify API + Prisma/PostgreSQL
- `AWS deployment mode`: Next.js frontend + Cognito + API Gateway/Lambda + DynamoDB/S3 + IoT Core ingest

The product in the codebase is still `limpid`: an iPhone-assisted sampling flow and Arduino-based edge devices capture measurements, the backend stores sample metadata and images, and the frontend visualizes the data in dashboards, tables, and a live map.

## Current Architecture

### Local mode

```text
Frontend (Next.js)
  -> Fastify API (`backend/src/app.ts`)
  -> Prisma
  -> PostgreSQL
  -> local uploads or S3
```

### AWS mode

```text
Frontend (Next.js)
  -> Cognito Hosted UI / PKCE login
  -> API Gateway HTTP API
  -> Lambda API handler (`backend/src/aws/handlers/api.ts`)
  -> DynamoDB + S3

Arduino / edge device
  -> AWS IoT Core MQTT
  -> IoT Rule
  -> Lambda ingest handler (`backend/src/aws/handlers/iotIngest.ts`)
  -> DynamoDB
```

Important runtime detail:

- `APP_RUNTIME=local` keeps the original Fastify + Prisma + Postgres path
- `APP_RUNTIME=aws` switches the backend to the serverless AWS handlers and DynamoDB-backed repositories
- `NEXT_PUBLIC_AUTH_MODE=local` uses the legacy local login flow
- `NEXT_PUBLIC_AUTH_MODE=cognito` uses the Cognito hosted sign-in flow

## What Changed For AWS

The root of the repo used to describe only the original local stack. The codebase now includes AWS-native pieces that are part of the supported path:

- `backend/template.yaml`: SAM template for the AWS stack
- `backend/src/aws/`: Lambda handlers, Cognito auth parsing, and DynamoDB repositories
- `frontend/src/lib/auth.ts`: local auth vs Cognito runtime switch
- `frontend/src/app/auth/callback/page.tsx`: Cognito redirect completion
- `POST /uploads/presign`: authenticated presigned S3 upload flow

In AWS mode:

- user auth is handled by Cognito, not local JWT login
- `/auth/login` and `/auth/register` on the AWS handler intentionally return `501`
- sample metadata lives in DynamoDB
- sample images are uploaded to S3 via presigned URLs
- device ingest is designed around AWS IoT Core instead of only local `/ingest/*` HTTP endpoints

## Data Flow

### Web app flow

1. Users visit the public landing page in `frontend/`.
2. In local mode, sign-in is handled by the backend auth routes.
3. In AWS mode, sign-in redirects through Cognito Hosted UI using authorization code + PKCE.
4. The frontend calls the API for samples, devices, stats, map markers, and admin data.
5. When uploading an image in AWS mode, the client first requests `POST /uploads/presign`, then uploads the file directly to S3.

### Device ingest flow

1. Edge devices produce sample payloads with device id, timestamp, geolocation, confidence, and estimate values.
2. In local mode, payloads can still hit the Fastify ingest endpoints.
3. In AWS mode, devices publish to the IoT Core topic matched by the SAM rule:
   `waterquality/devices/+/samples`
4. The IoT Rule invokes the ingest Lambda, which validates and stores sample/device data.

## Tech Stack

### Frontend

| Technology | Purpose |
| --- | --- |
| Next.js 16 | App Router, rendering, routing |
| React 19 | UI framework |
| TypeScript | Type safety |
| Tailwind CSS 4 | Styling |
| TanStack Query | API state and caching |
| React Hook Form + Zod | Forms and validation |
| Recharts | Dashboard charts |
| Leaflet + React Leaflet | Map rendering |

### Backend

| Technology | Local mode | AWS mode |
| --- | --- | --- |
| Runtime | Node.js 20 | Node.js 20 on Lambda |
| HTTP surface | Fastify | API Gateway HTTP API |
| Data store | PostgreSQL via Prisma | DynamoDB repositories |
| Auth | JWT + bcrypt | Cognito JWT claims |
| File storage | local uploads or S3 | S3 presigned upload/download |
| Validation | Zod | Zod |
| Testing | Vitest | Vitest |

### AWS infrastructure

The SAM template provisions:

- S3 bucket for sample images
- DynamoDB tables for samples, devices, user profiles, and audit logs
- HTTP API with Cognito JWT authorizer
- API Lambda
- IoT ingest Lambda
- IoT Topic Rule for sample events

## Repository Layout

```text
├── backend/
│   ├── prisma/                  # Local relational schema and seed data
│   ├── src/
│   │   ├── app.ts               # Fastify app for local runtime
│   │   ├── server.ts            # Local backend entry point
│   │   ├── config.ts            # Shared environment configuration
│   │   ├── routes/              # Local Fastify routes
│   │   ├── services/            # Local business logic
│   │   ├── aws/                 # Lambda handlers, Cognito auth, DynamoDB repos
│   │   ├── storage/             # Local/S3 storage abstraction
│   │   └── tests/               # Vitest tests for local and AWS code paths
│   ├── template.yaml            # AWS SAM template
│   └── README.md
├── frontend/
│   ├── src/app/                 # Landing page, login, callback, app routes
│   ├── src/components/          # UI components
│   ├── src/lib/                 # API client, auth mode switch, helpers
│   └── README.md
├── docker-compose.yml           # Local Postgres + API + frontend
├── AWS_MIGRATION_GUIDE.md       # Detailed AWS setup and migration walkthrough
├── backend_spec.md
├── frontend_spec.md
└── README.md
```

## Local Development

Local development still uses the original Fastify + Prisma + Postgres stack.

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

Recommended local backend settings:

```env
APP_RUNTIME=local
STORAGE_PROVIDER=local
```

### 3. Run the frontend

In another terminal:

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

The frontend runs on `http://localhost:3000` by default and targets `http://localhost:3001` unless `NEXT_PUBLIC_API_BASE_URL` is changed.

Recommended local frontend settings:

```env
NEXT_PUBLIC_AUTH_MODE=local
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

Visit:

- `http://localhost:3000/` for the public landing page
- `http://localhost:3000/login` for authentication
- `http://localhost:3000/dashboard` after sign-in

## Local Docker Workflow

The provided [`docker-compose.yml`](./docker-compose.yml) is intentionally the local development stack, not a local emulation of the AWS Lambda/API Gateway deployment.

It starts:

- `db`: Postgres 16
- `api`: the Fastify backend on `http://localhost:3001`
- `frontend`: the Next.js app on `http://localhost:3000`

Start the full local stack:

```bash
docker compose up --build
```

Run it in the background:

```bash
docker compose up -d --build
```

Stop it:

```bash
docker compose down
```

Important detail: the browser-facing frontend must use a host-reachable API URL. In this compose setup, `NEXT_PUBLIC_API_BASE_URL` is intentionally `http://localhost:3001`, not `http://api:3001`.

The frontend image now accepts the full public AWS auth configuration as build args and runtime env values. That means you can still build the frontend container in Cognito mode when needed, for example:

```bash
NEXT_PUBLIC_API_BASE_URL=https://YOUR_HTTP_API_ID.execute-api.YOUR_REGION.amazonaws.com \
NEXT_PUBLIC_AUTH_MODE=cognito \
NEXT_PUBLIC_COGNITO_DOMAIN=https://YOUR_DOMAIN.auth.YOUR_REGION.amazoncognito.com \
NEXT_PUBLIC_COGNITO_CLIENT_ID=YOUR_COGNITO_APP_CLIENT_ID \
docker compose up --build frontend
```

Important limitation: compose will still start the local `api` and `db` services unless you choose a frontend-only workflow. The AWS backend itself is deployed with SAM, not with compose.

## AWS Deployment Summary

The repository includes the AWS backend, but deployment still requires AWS-side setup and credentials.

Prerequisites:

- AWS account and authenticated CLI session
- AWS SAM CLI
- Cognito User Pool and App Client
- Node.js 20

### 1. Build the backend artifacts

```bash
cd backend
npm install
npm run build
```

The Lambda handlers in [`backend/template.yaml`](./backend/template.yaml) point at compiled files under `dist/aws/...`, so the backend must be built before deployment.

### 2. Deploy the SAM stack

```bash
sam deploy --guided
```

The template expects:

- `FrontendOrigin`
- `CognitoUserPoolId`
- `CognitoUserPoolClientId`

Useful stack outputs:

- `HttpApiUrl`
- `SampleImagesBucketName`

### 3. Configure the frontend for Cognito + deployed API

Set the frontend environment to the AWS path:

```env
NEXT_PUBLIC_AUTH_MODE=cognito
NEXT_PUBLIC_API_BASE_URL=https://YOUR_HTTP_API_URL
NEXT_PUBLIC_COGNITO_DOMAIN=https://YOUR_DOMAIN.auth.YOUR_REGION.amazoncognito.com
NEXT_PUBLIC_COGNITO_CLIENT_ID=YOUR_COGNITO_APP_CLIENT_ID
NEXT_PUBLIC_COGNITO_REDIRECT_URI=http://localhost:3000/auth/callback
NEXT_PUBLIC_COGNITO_LOGOUT_URI=http://localhost:3000/login
NEXT_PUBLIC_COGNITO_SCOPE=openid email profile
```

For production, replace the localhost callback and logout URLs with your deployed frontend domain.

Important Cognito note: if the hosted login page returns `Login pages unavailable`, the app client likely needs a managed login branding assignment. See [`AWS_MIGRATION_GUIDE.md`](./AWS_MIGRATION_GUIDE.md) for the `create-managed-login-branding --use-cognito-provided-values` fix.

### 4. Configure backend runtime values for AWS

The SAM template sets these automatically for Lambda:

- `APP_RUNTIME=aws`
- `STORAGE_PROVIDER=s3`
- `AWS_REGION`
- `AWS_S3_BUCKET`
- `AWS_DDB_*`
- `AWS_COGNITO_USER_POOL_ID`
- `AWS_COGNITO_USER_POOL_CLIENT_ID`

If you are testing AWS-backed code outside Lambda, those same variables need to exist in your backend environment.

## Environment Variables

### Backend

Key runtime switches in [`backend/.env.example`](./backend/.env.example):

- `APP_RUNTIME`: `local` or `aws`
- `STORAGE_PROVIDER`: `local` or `s3`
- `DATABASE_URL`: required for local Prisma/Postgres mode
- `AWS_S3_BUCKET`, `AWS_REGION`
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`
- `AWS_DDB_SAMPLES_TABLE`, `AWS_DDB_DEVICES_TABLE`, `AWS_DDB_USER_PROFILES_TABLE`, `AWS_DDB_AUDIT_LOGS_TABLE`
- `AWS_COGNITO_USER_POOL_ID`, `AWS_COGNITO_USER_POOL_CLIENT_ID`, `AWS_COGNITO_GROUPS_CLAIM`

### Frontend

Key runtime switches in [`frontend/.env.example`](./frontend/.env.example):

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_AUTH_MODE`: `local` or `cognito`
- `NEXT_PUBLIC_COGNITO_DOMAIN`
- `NEXT_PUBLIC_COGNITO_CLIENT_ID`
- `NEXT_PUBLIC_COGNITO_REDIRECT_URI`
- `NEXT_PUBLIC_COGNITO_LOGOUT_URI`
- `NEXT_PUBLIC_COGNITO_SCOPE`

## Seed Credentials

The local Prisma seed script creates:

- `admin@example.com` / `admin1234`
- `researcher@example.com` / `researcher1234`

These credentials are for local mode only. In AWS mode, users come from Cognito.

## Testing

Backend tests:

```bash
cd backend
npm test
```

Frontend lint:

```bash
cd frontend
npm run lint
```

There are dedicated tests for the AWS handlers under `backend/src/tests/`, including API and IoT ingest coverage.

## Additional Documentation

- [`AWS_MIGRATION_GUIDE.md`](./AWS_MIGRATION_GUIDE.md): full AWS setup and migration walkthrough
- [`backend/template.yaml`](./backend/template.yaml): deployed AWS resource shape and runtime wiring
- [`backend/src/config.ts`](./backend/src/config.ts): backend runtime switches and environment contract
- [`frontend/src/lib/auth.ts`](./frontend/src/lib/auth.ts): frontend local-vs-Cognito auth behavior

For AWS work, prefer the migration guide plus the SAM template as the source of truth. This root README is intended to orient contributors to the current dual-runtime architecture.
