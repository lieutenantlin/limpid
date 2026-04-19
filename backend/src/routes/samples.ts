import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { SampleSource } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/authenticate.js';
import * as sampleService from '../services/sampleService.js';
import * as audit from '../services/auditService.js';

const listQuery = z.object({
  deviceId: z.string().optional(),
  source: z.nativeEnum(SampleSource).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

const updateBody = z.object({
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function sampleRoutes(app: FastifyInstance) {
  app.get('/samples/map', { preHandler: authenticate }, async (_request, reply) => {
    const result = await sampleService.listSamples({ limit: 100 });
    const items = result.data.map((sample) => ({
      id: sample.id,
      sampleId: sample.sampleId,
      lat: sample.latitude,
      lng: sample.longitude,
      capturedAt: sample.capturedAt.toISOString(),
      microplasticEstimate: sample.microplasticEstimate,
      confidence: sample.confidence,
      deviceId: sample.device?.deviceId ?? sample.deviceId,
    }));
    return reply.send({ items });
  });

  app.get('/samples', { preHandler: authenticate }, async (request, reply) => {
    const query = listQuery.safeParse(request.query);
    if (!query.success) return reply.status(400).send({ error: 'Validation failed', details: query.error.flatten() });

    const result = await sampleService.listSamples(query.data);
    return reply.send(result);
  });

  app.get('/samples/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const sample = await sampleService.getSample(id);
    if (!sample) return reply.status(404).send({ error: 'Sample not found' });

    const { imageUrl, thumbnailUrl } = await sampleService.getSignedImageUrls(sample);
    const tags = sample.tags.map((t) => t.tag);
    return reply.send({ sample: { ...sample, tags, imageUrl, thumbnailUrl } });
  });

  app.patch(
    '/samples/:id',
    { preHandler: requireRole(['admin', 'researcher']) },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = updateBody.safeParse(request.body);
      if (!body.success) return reply.status(400).send({ error: 'Validation failed', details: body.error.flatten() });

      const existing = await sampleService.getSample(id);
      if (!existing) return reply.status(404).send({ error: 'Sample not found' });

      const updated = await sampleService.updateSample(id, body.data);
      audit.log(request.user.id, 'sample.update', 'sample', id, body.data as unknown as import('@prisma/client').Prisma.InputJsonValue);
      return reply.send({ sample: updated });
    },
  );

  app.delete(
    '/samples/:id',
    { preHandler: requireRole(['admin']) },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const existing = await sampleService.getSample(id);
      if (!existing) return reply.status(404).send({ error: 'Sample not found' });

      await sampleService.deleteSample(id);
      audit.log(request.user.id, 'sample.delete', 'sample', id);
      return reply.status(204).send();
    },
  );
}
