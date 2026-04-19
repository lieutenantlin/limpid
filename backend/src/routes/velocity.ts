import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { spawn } from 'child_process';
import path from 'path';

interface VelocityQuery {
  lat?: string;
  lon?: string;
}

export async function velocityRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: VelocityQuery }>(
    '/velocity',
    {
      schema: {
        querystring: {
          type: 'object',
          required: ['lat', 'lon'],
          properties: {
            lat: { type: 'number' },
            lon: { type: 'number' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: VelocityQuery }>, reply: FastifyReply) => {
      const { lat, lon } = request.query;

      if (lat === undefined || lon === undefined) {
        return reply.status(400).send({ error: 'lat and lon are required query parameters' });
      }

      return new Promise((resolve, reject) => {
        const scriptPath = path.resolve(
  process.cwd(),
  process.cwd().includes('/backend') ? 'scripts' : 'backend/scripts',
  'velocity_lookup.py'
);
        const proc = spawn('python', [scriptPath, '--lat', String(lat), '--lon', String(lon)], {
          cwd: process.cwd(),
        });

        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        proc.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        proc.on('close', (code) => {
          if (code !== 0) {
            fastify.log.error({ stderr }, 'Velocity lookup failed');
            return resolve(reply.status(500).send({ error: 'Velocity lookup failed', details: stderr }));
          }

          // Parse the output
          const result: Record<string, number> = {};
          
          const uMatch = stdout.match(/Eastern velocity \(u\):\s*([-\d.]+)/);
          const vMatch = stdout.match(/Northern velocity \(v\):\s*([-\d.]+)/);
          const speedMatch = stdout.match(/Speed:\s*([-\d.]+)/);
          const directionMatch = stdout.match(/Direction:\s*([-\d.]+)/);
          
          if (uMatch) result.u = parseFloat(uMatch[1]);
          if (vMatch) result.v = parseFloat(vMatch[1]);
          if (speedMatch) result.speed = parseFloat(speedMatch[1]);
          if (directionMatch) result.direction = parseFloat(directionMatch[1]);

          resolve(reply.send(result));
        });

        proc.on('error', (err) => {
          fastify.log.error(err, 'Failed to spawn velocity lookup script');
          resolve(reply.status(500).send({ error: 'Failed to run velocity lookup' }));
        });
      });
    }
  );
}
