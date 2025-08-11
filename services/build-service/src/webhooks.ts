import Fastify, { FastifyInstance } from 'fastify';
import crypto from 'node:crypto';

function verifySignature(bodyRaw: string, signature: string | undefined, secret: string) {
  if (!signature) return false;
  const hmac = crypto.createHmac('sha256', secret);
  const digest = `sha256=${hmac.update(bodyRaw).digest('hex')}`;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

import { buildQueue } from './queue';

export function registerGitHubWebhooks(app: FastifyInstance) {
  app.addContentTypeParser('*', { parseAs: 'string' }, (req, body: string, done) => done(null, body));

  app.post('/webhooks/github', async (req, reply) => {
    const secret = process.env.GITHUB_WEBHOOK_SECRET ?? '';
    const sig = req.headers['x-hub-signature-256'] as string | undefined;
    const bodyRaw = req.body as string;
    if (!verifySignature(bodyRaw, sig, secret)) {
      return reply.code(401).send({ error: 'invalid signature' });
    }

    const event = req.headers['x-github-event'];
    const payload = JSON.parse(bodyRaw);

    if (event === 'pull_request' && ['opened', 'synchronize', 'reopened'].includes(payload.action)) {
      const repoSlug = payload.repository.full_name as string; // owner/name
      const gitRef = `refs/pull/${payload.pull_request.number}/head`;
      const { rows } = await pool.query('select p.id as project_id, p.name as project_slug from repos r join projects p on p.id = r.project_id where r.provider=$1 and r.repo_slug=$2 limit 1', ['github', repoSlug]);
      if (rows.length === 0) {
        app.log.warn({ repoSlug }, 'repo not mapped');
      } else {
        const buildId = crypto.randomUUID();
        await buildQueue.add('build', { buildId, projectId: rows[0].project_id, projectSlug: rows[0].project_slug, repoSlug, gitRef });
        app.log.info({ buildId, repoSlug, gitRef }, 'queued build from webhook');
      }
    }

    return { ok: true };
  });
}
