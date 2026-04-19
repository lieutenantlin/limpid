# Style Guide

This document defines the coding conventions, patterns, and best practices for the Aqua Graph microplastics monitoring platform. All contributors and AI agents should follow these guidelines.

---

## General Principles

1. **Consistency over cleverness** - Prefer patterns established in the codebase
2. **Explicit over implicit** - Clear naming and type annotations
3. **Minimal abstractions** - Don't over-engineer; add structure only when needed
4. **Testable code** - Write code that can be tested; avoid hidden dependencies

---

## TypeScript Conventions

### File Organization

- One major type/function per file (group related utilities together)
- Use `.ts` for utilities/types, `.tsx` for React components
- Use `.js` extension in imports for JavaScript interop (Fastify convention)

### Naming

| Element | Convention | Example |
|---------|------------|---------|
| Files | kebab-case | `authService.ts`, `login-page-client.tsx` |
| Functions | camelCase, verb-first | `getSample()`, `updateDeviceHeartbeat()` |
| Classes | PascalCase | `ApiError`, `JwtPayload` |
| Interfaces | PascalCase with `I` prefix optional | `SampleFilters` (not `ISampleFilters`) |
| Constants | SCREAMING_SNAKE_CASE | `JWT_EXPIRES_IN`, `NODE_ENV` |
| Enums | PascalCase, members PascalCase | `UserRole.Admin` |

### Type Annotations

- Use explicit return types for exported functions
- Use `as const` for configuration objects
- Prefer interfaces over types for object shapes

```typescript
// ✅ Good
export async function getSample(id: string): Promise<Sample | null> {
  return prisma.sample.findUnique({ where: { id } });
}

// ❌ Avoid
export async function getSample(id: string) {
  return prisma.sample.findUnique({ where: { id } });
}
```

### Null Handling

- Use `null` for "intentional absence" (not `undefined`)
- Use optional chaining `?.` and nullish coalescing `??`
- Avoid `as any` or non-null assertions `!`

---

## Backend (Fastify + Prisma)

### Project Structure

```
src/
├── app.ts              # Fastify app factory
├── server.ts           # Entry point
├── config.ts           # Environment config (singleton)
├── lib/
│   └── prisma.ts       # Prisma client (singleton)
├── plugins/            # @fastify plugins
├── middleware/         # Request preHandlers
├── routes/             # Route handlers (one file per route group)
├── services/           # Business logic
├── storage/            # Provider abstraction
└── tests/              # Vitest tests
```

### Route Handler Pattern

Each route group in its own file:

```typescript
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/authenticate.js';
import * as sampleService from '../services/sampleService.js';

const querySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export async function sampleRoutes(app: FastifyInstance) {
  app.get('/samples', { preHandler: authenticate }, async (request, reply) => {
    const query = querySchema.safeParse(request.query);
    if (!query.success) {
      return reply.status(400).send({ error: 'Validation failed', details: query.error.flatten() });
    }
    const result = await sampleService.listSamples(query.data);
    return reply.send(result);
  });
}
```

### Service Pattern

Services handle business logic, routes handle HTTP:

```typescript
// services/sampleService.ts
export async function listSamples(filters: SampleFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
  // ... implementation
}

// routes/samples.ts - just calls service
const result = await sampleService.listSamples(query.data);
```

### Error Handling

- Use Fastify's error handler for unhandled errors
- Return structured errors: `{ error: string, details?: ... }`
- Use appropriate HTTP status codes (400 for validation, 401/403 for auth, 404 for not found, 500 for server errors)

### Database (Prisma)

- Use Prisma client as a singleton (export from `lib/prisma.ts`)
- Use `upsert` for idempotent operations (ingest endpoints)
- Use raw queries only when necessary (e.g., `date_trunc` for timeseries)
- Include related data with `include` option

### Configuration

All config in `src/config.ts`:

```typescript
export const config = {
  port: parseInt(optional('PORT', '3001'), 10),
  jwt: {
    secret: optional('JWT_SECRET', 'dev-secret'),
    expiresIn: optional('JWT_EXPIRES_IN', '7d'),
  },
} as const;
```

---

## Frontend (Next.js App Router)

### Project Structure

```
src/
├── app/                    # App Router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   ├── login/             # Login route
│   └── (app)/             # Protected routes (route group)
│       ├── layout.tsx     # App shell
│       ├── dashboard/
│       ├── map/
│       ├── samples/
│       ├── devices/
│       └── admin/
├── components/
│   ├── ui/                # shadcn/Base UI components
│   ├── auth/              # Auth components
│   └── *.tsx              # Feature components
└── lib/
    ├── api.ts             # API client
    ├── auth.ts            # Token helpers
    ├── types.ts           # TypeScript types
    └── utils.ts           # Utilities
```

### Component Pattern

- Use function components with explicit prop types
- Use `"use client"` directive for client-side components
- Co-locate small components with their parent

```typescript
// ✅ Good
interface DashboardProps {
  stats: SampleStats;
  recentSamples: Sample[];
}

export function Dashboard({ stats, recentSamples }: DashboardProps) {
  return ( ... );
}

// ❌ Avoid
export default function Dashboard({ stats, recentSamples }) {
  return ( ... );
}
```

### API Client

Use a class or module pattern with proper error handling:

```typescript
class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // ... implementation with proper error handling
}
```

### State Management

- Use TanStack Query for server state
- Use React `useState` for UI state
- Avoid context for everything (TanStack Query handles caching)

### Styling

- Use Tailwind CSS 4 with the custom OKLCH theme
- Use shadcn/Base UI components as primitives
- Apply the `.surface` utility class for glassy panel effects

---

## Git & Commits

### Branch Naming

| Type | Convention | Example |
|------|------------|---------|
| Feature | `feature/description` | `feature/add-sample-filters` |
| Bugfix | `fix/description` | `fix/auth-token-expiry` |
| Refactor | `refactor/description` | `refactor/api-client` |
| Docs | `docs/description` | `docs/update-readme` |

### Commit Messages

```
type(scope): description

- Detail 1
- Detail 2
```

Examples:
```
feat(samples): add filter by device ID

- Add deviceId query param to /samples
- Update sampleService to support filtering

fix(auth): handle expired tokens properly

- Clear token on 401 response
- Redirect to login page
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`

---

## Testing

### Backend (Vitest)

```typescript
import { describe, it, expect, vi } from 'vitest';
import { buildApp } from '../app.js';

describe('GET /health', () => {
  it('returns healthy status', async () => {
    const app = await buildApp();
    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
  });
});
```

- Mock Prisma at the module level
- Test happy path and common error cases
- Group tests by route/feature

---

## Common Patterns

### Idempotent Ingest

```typescript
// Upsert by external ID ensures idempotency
return prisma.sample.upsert({
  where: { sampleId: data.sampleId },
  update: { ... },
  create: { ... },
});
```

### Auth Middleware

```typescript
// Simple authenticate
export async function authenticate(request, reply) { ... }

// Role guard (wraps authenticate)
export function requireRole(roles: UserRole[]) {
  return async function(request, reply) {
    await authenticate(request, reply);
    if (!roles.includes(request.user.role)) {
      return reply.status(403).send({ error: 'Insufficient permissions' });
    }
  };
}
```

### Storage Abstraction

```typescript
// Interface in storageInterface.ts
interface StorageProvider {
  getSignedDownloadUrl(key: string): Promise<string>;
  deleteObject(key: string): Promise<void>;
}

// Factory switches on config
export function getStorage(): StorageProvider {
  return config.storage.provider === 's3'
    ? new S3StorageProvider()
    : new LocalStorageProvider();
}
```

---

## File Headers

For new files, consider adding a brief comment describing purpose:

```typescript
// Sample service - handles CRUD operations for samples
import { prisma } from '../lib/prisma.js';
// ...
```

---

## Linting & Formatting

The project uses:
- ESLint for code quality
- Prettier for formatting (via IDE integration)

Run before committing:
```bash
# Backend
npm run lint

# Frontend
npm run lint
```

---

## Resources

- [Backend README](../backend/README.md) - API documentation
- [Frontend README](../frontend/README.md) - Frontend structure
- [CLAUDE.md](./CLAUDE.md) - Claude Code guidance
- [Prisma Docs](https://www.prisma.io/docs/) - Database ORM
- [Fastify Docs](https://fastify.dev/) - HTTP framework
- [Next.js Docs](https://nextjs.org/docs) - React framework