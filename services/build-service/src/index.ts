import Fastify from 'fastify';
import cors from '@fastify/cors';
import { z } from 'zod';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'node:crypto';
import path from 'node:path';
import { registerGitHubWebhooks } from './webhooks';
import { buildQueue } from './queue';

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });
registerGitHubWebhooks(app);

const StartBuildInput = z.object({ projectId: z.string().uuid(), gitRef: z.string(), projectSlug: z.string().min(1), repoSlug: z.string().min(1) });

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CF_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: process.env.CF_R2_ACCESS_KEY_ID && process.env.CF_R2_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.CF_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CF_R2_SECRET_ACCESS_KEY,
  } : undefined,
});

app.post('/builds:start', async (req, reply) => {
  const input = StartBuildInput.parse(req.body);
  // Stub: enqueue build and return id
  const id = crypto.randomUUID();
  app.log.info({ id, ...input }, 'queued build');
  await buildQueue.add('build', {
    buildId: id,
    projectId: input.projectId,
    projectSlug: input.projectSlug,
    repoSlug: input.repoSlug,
    gitRef: input.gitRef,
  });
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
