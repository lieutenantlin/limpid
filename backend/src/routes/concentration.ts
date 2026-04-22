import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { spawn } from 'child_process';
import path from 'path';

interface ConcentrationQuery {
  lat?: string;
  lon?: string;
}

export async function concentrationRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: ConcentrationQuery }>(
    '/concentration',
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
    async (request: FastifyRequest<{ Querystring: ConcentrationQuery }>, reply: FastifyReply) => {
      const { lat, lon } = request.query;

      if (lat === undefined || lon === undefined) {
        return reply.status(400).send({ error: 'lat and lon are required query parameters' });
      }

      return new Promise((resolve, reject) => {
        const scriptPath = path.resolve(
          process.cwd(),
          process.cwd().includes('/backend') ? 'scripts' : 'backend/scripts',
          'microplastics_lookup.py'
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
            fastify.log.error({ stderr }, 'Concentration lookup failed');
            // Check for out-of-range coordinates error
            if (stderr.includes('out of valid range')) {
              return resolve(reply.status(400).send({ error: stderr.trim() }));
            }
            return resolve(reply.status(500).send({ error: 'Concentration lookup failed', details: stderr }));
          }

          // Parse the output
          const concentrationClassMatch = stdout.match(/Concentration Class:\s*(.*)/);
          const measurementMatch = stdout.match(/Measurement:\s*([\d.]+)/);

          if (!concentrationClassMatch || !measurementMatch) {
            return resolve(reply.status(500).send({ error: 'Failed to parse concentration result' }));
          }

          const result = {
            concentrationClass: concentrationClassMatch[1].trim(),
            measurement: parseFloat(measurementMatch[1]),
          };

          resolve(reply.send(result));
        });

        proc.on('error', (err) => {
          fastify.log.error(err, 'Failed to spawn concentration lookup script');
          resolve(reply.status(500).send({ error: 'Failed to run concentration lookup' }));
        });
      });
    }
  );
}