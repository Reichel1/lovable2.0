import Fastify, { FastifyInstance } from 'fastify';
import crypto from 'node:crypto';

function verifySignature(bodyRaw: string, signature: string | undefined, secret: string) {
  if (!signature) return false;
  const hmac = crypto.createHmac('sha256', secret);
  const digest = `sha256=${hmac.update(bodyRaw).digest('hex')}`;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

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
      // TODO: map repo -> project and enqueue build
      app.log.info({ pr: payload.pull_request.number, repo: payload.repository.full_name }, 'enqueue preview build');
    }

    return { ok: true };
  });
}
