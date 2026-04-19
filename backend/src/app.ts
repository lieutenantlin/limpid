import Fastify from 'fastify';
import { registerCors } from './plugins/cors.js';
import { registerSensible } from './plugins/sensible.js';
import { healthRoutes } from './routes/health.js';
import { authRoutes } from './routes/auth.js';
import { ingestRoutes } from './routes/ingest.js';
import { sampleRoutes } from './routes/samples.js';
import { deviceRoutes } from './routes/devices.js';
import { statsRoutes } from './routes/stats.js';
import { adminRoutes } from './routes/admin.js';
import { velocityRoutes } from './routes/velocity.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env['NODE_ENV'] === 'test' ? 'silent' : 'info',
    },
  });

  await registerSensible(app);
  await registerCors(app);

  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(ingestRoutes);
  await app.register(sampleRoutes);
  await app.register(deviceRoutes);
  await app.register(statsRoutes);
  await app.register(adminRoutes);
  await app.register(velocityRoutes);

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    const statusCode = error.statusCode ?? 500;
    reply.status(statusCode).send({
      error: statusCode === 500 ? 'Internal server error' : error.message,
    });
  });

  return app;
}
