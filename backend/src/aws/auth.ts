import { config } from '../config.js';
import type { ApiGatewayEvent } from './types.js';
import type { UserProfileRecord, UserRole } from './models.js';

export interface AuthIdentity {
  id: string;
  cognitoSub: string;
  email: string;
  name: string;
  role: UserRole;
  groups: string[];
}

function parseGroups(raw: string | undefined): string[] {
  if (!raw) return [];

  return raw
    .replace(/^\[/, '')
    .replace(/\]$/, '')
    .split(',')
    .map((group) => group.trim())
    .filter(Boolean);
}

function toRole(groups: string[], fallback: string | undefined): UserRole {
  const candidates = [...groups, fallback ?? ''];
  if (candidates.includes('admin')) return 'admin';
  if (candidates.includes('researcher')) return 'researcher';
  return 'viewer';
}

export function getAuthIdentity(event: ApiGatewayEvent): AuthIdentity | null {
  const claims = event.requestContext?.authorizer?.jwt?.claims;
  if (!claims) return null;

  const cognitoSub = claims['sub'];
  if (!cognitoSub) return null;

  const groups = parseGroups(claims[config.aws.cognito.groupsClaim] ?? claims['groups']);
  const role = toRole(groups, claims['custom:role']);

  return {
    id: cognitoSub,
    cognitoSub,
    email: claims['email'] ?? '',
    name: claims['name'] ?? claims['cognito:username'] ?? claims['email'] ?? 'Unknown user',
    role,
    groups,
  };
}

export function requireAuth(event: ApiGatewayEvent): AuthIdentity {
  const identity = getAuthIdentity(event);
  if (!identity) {
    const error = new Error('Unauthorized');
    (error as NodeJS.ErrnoException).code = 'UNAUTHORIZED';
    throw error;
  }
  return identity;
}

export function requireRole(identity: AuthIdentity, roles: UserRole[]) {
  if (!roles.includes(identity.role)) {
    const error = new Error('Insufficient permissions');
    (error as NodeJS.ErrnoException).code = 'FORBIDDEN';
    throw error;
  }
}

export function toUserResponse(profile: UserProfileRecord | AuthIdentity): UserProfileRecord {
  const createdAt = 'createdAt' in profile ? profile.createdAt : new Date().toISOString();
  const updatedAt = 'updatedAt' in profile ? profile.updatedAt : createdAt;

  return {
    id: profile.id,
    cognitoSub: profile.cognitoSub,
    email: profile.email,
    name: profile.name,
    role: profile.role,
    createdAt,
    updatedAt,
  };
}
