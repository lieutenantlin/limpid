const env = process.env;

function required(key: string): string {
  const val = env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
}

function optional(key: string, fallback: string): string {
  return env[key] ?? fallback;
}

function optionalList(key: string): string[] {
  const val = env[key];
  if (!val) return [];

  return val
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export const config = {
  port: parseInt(optional('PORT', '3001'), 10),
  nodeEnv: optional('NODE_ENV', 'development'),
  databaseUrl: optional('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/microplastics'),
  corsOrigins: optionalList('CORS_ORIGINS'),
  app: {
    runtime: optional('APP_RUNTIME', 'local') as 'local' | 'aws',
  },
  jwt: {
    secret: optional('JWT_SECRET', 'dev-secret-change-in-production'),
    expiresIn: optional('JWT_EXPIRES_IN', '7d'),
  },
  storage: {
    provider: optional('STORAGE_PROVIDER', 'local') as 'local' | 's3',
    localPath: optional('LOCAL_STORAGE_PATH', './uploads'),
  },
  aws: {
    region: optional('AWS_REGION', 'us-east-1'),
    bucket: optional('AWS_S3_BUCKET', 'microplastics-samples'),
    accessKeyId: env['AWS_ACCESS_KEY_ID'],
    secretAccessKey: env['AWS_SECRET_ACCESS_KEY'],
    dynamodb: {
      samplesTable: optional('AWS_DDB_SAMPLES_TABLE', 'Samples'),
      devicesTable: optional('AWS_DDB_DEVICES_TABLE', 'Devices'),
      userProfilesTable: optional('AWS_DDB_USER_PROFILES_TABLE', 'UserProfiles'),
      auditLogsTable: optional('AWS_DDB_AUDIT_LOGS_TABLE', 'AuditLogs'),
      deviceCapturedAtIndex: optional('AWS_DDB_DEVICE_CAPTURED_AT_INDEX', 'deviceId-capturedAt-index'),
      userCapturedAtIndex: optional('AWS_DDB_USER_CAPTURED_AT_INDEX', 'createdByUserId-capturedAt-index'),
    },
    cognito: {
      userPoolId: env['AWS_COGNITO_USER_POOL_ID'],
      userPoolClientId: env['AWS_COGNITO_USER_POOL_CLIENT_ID'],
      groupsClaim: optional('AWS_COGNITO_GROUPS_CLAIM', 'cognito:groups'),
    },
  },
} as const;
