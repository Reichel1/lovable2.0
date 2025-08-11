import Fastify from 'fastify';
import cors from '@fastify/cors';
import { z } from 'zod';

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

const DeployInput = z.object({ envId: z.string().uuid(), buildId: z.string().uuid(), strategy: z.enum(['canary','blue','green']).default('canary') });

app.post('/deployments', async (req, reply) => {
  const input = DeployInput.parse(req.body);
  const id = crypto.randomUUID();
  app.log.info({ id, ...input }, 'deployment requested');
  return reply.send({ id, status: 'pending', canaryPercent: input.strategy === 'canary' ? 1 : 0 });
});

app.post('/deployments/:id/promote', async (req, reply) => {
  const id = (req.params as any).id as string;
  return reply.send({ id, status: 'healthy' });
});

app.post('/deployments/:id/rollback', async (req, reply) => {
  const id = (req.params as any).id as string;
  return reply.send({ id, status: 'rolled_back' });
});

const port = Number(process.env.PORT ?? 3102);
app.listen({ port, host: '0.0.0.0' }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
