import Fastify from 'fastify';
import cors from '@fastify/cors';
import { z } from 'zod';

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

const StartBuildInput = z.object({ projectId: z.string().uuid(), gitRef: z.string() });

app.post('/builds:start', async (req, reply) => {
  const input = StartBuildInput.parse(req.body);
  // Stub: enqueue build and return id
  const id = crypto.randomUUID();
  app.log.info({ id, ...input }, 'queued build');
  return reply.send({ id, status: 'queued' });
});

app.get('/builds/:id/logs', async (req, reply) => {
  const id = (req.params as any).id as string;
  return reply.send({ id, logs: 'logs not implemented yet' });
});

const port = Number(process.env.PORT ?? 3101);
app.listen({ port, host: '0.0.0.0' }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
