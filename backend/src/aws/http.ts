import type { ApiGatewayEvent, ApiGatewayResult } from './types.js';

const jsonHeaders = {
  'content-type': 'application/json',
};

export function json(statusCode: number, body: unknown): ApiGatewayResult {
  return {
    statusCode,
    headers: jsonHeaders,
    body: JSON.stringify(body),
  };
}

export function empty(statusCode: number): ApiGatewayResult {
  return {
    statusCode,
    headers: jsonHeaders,
    body: '',
  };
}

export function parseBody<T>(event: ApiGatewayEvent): T | null {
  if (!event.body) return null;
  const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
  return JSON.parse(raw) as T;
}

export function normalizePath(path: string): string {
  if (!path) return '/';
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
}

export function matchPath(path: string, pattern: string): Record<string, string> | null {
  const normalizedPath = normalizePath(path);
  const normalizedPattern = normalizePath(pattern);
  const pathParts = normalizedPath.split('/').filter(Boolean);
  const patternParts = normalizedPattern.split('/').filter(Boolean);

  if (pathParts.length !== patternParts.length) return null;

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i += 1) {
    const currentPattern = patternParts[i];
    const currentPart = pathParts[i];
    if (!currentPart) return null;

    if (currentPattern.startsWith('{') && currentPattern.endsWith('}')) {
      params[currentPattern.slice(1, -1)] = decodeURIComponent(currentPart);
      continue;
    }

    if (currentPattern !== currentPart) return null;
  }

  return params;
}
