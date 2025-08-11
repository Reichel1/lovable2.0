import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { z } from 'zod';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(swagger, { openapi: { info: { title: 'Control Plane API', version: '0.0.1' } } });
await app.register(swaggerUi, { routePrefix: '/docs' });

const health = z.object({ status: z.literal('ok') });
app.get('/health', async () => ({ status: 'ok' }));

app.get('/openapi.json', async () => app.swagger());

// DB-backed endpoints (minimal slice)
const ProjectCreate = z.object({ name: z.string().min(1), orgId: z.string().uuid(), runtimeType: z.enum(['static','edge','container']), region: z.string() });

app.get('/projects', async () => {
  const { rows } = await pool.query('select id, org_id as "orgId", name, runtime_type as "runtimeType", region from projects order by created_at desc limit 100');
  return rows;
});

app.post('/projects', async (req, reply) => {
  const input = ProjectCreate.parse(req.body);
  const { rows } = await pool.query(
    'insert into projects (org_id, name, runtime_type, region) values ($1,$2,$3,$4) returning id, org_id as "orgId", name, runtime_type as "runtimeType", region',
    [input.orgId, input.name, input.runtimeType, input.region]
  );
  return reply.code(201).send(rows[0]);
});

app.get('/projects/:id/builds', async (req) => {
  const projectId = (req.params as any).id as string;
  const { rows } = await pool.query(
    'select id, project_id as "projectId", git_ref as "gitRef", status, logs_url as "logsUrl", artifact_manifest_url as "artifactManifestUrl" from builds where project_id = $1 order by created_at desc limit 50',
    [projectId]
  );
  return rows;
});

app.get('/deployments', async () => {
  const { rows } = await pool.query(
    'select id, env_id as "envId", build_id as "buildId", strategy, canary_percent as "canaryPercent", status, promoted_at as "promotedAt", rolled_back_from as "rolledBackFrom" from deployments order by created_at desc limit 50'
  );
  return rows;
});

// Domain foundations
const DomainCreate = z.object({ envId: z.string().uuid(), hostname: z.string(), type: z.enum(['default','custom']).default('custom') });
app.post('/domains', async (req, reply) => {
  const input = DomainCreate.parse(req.body);
  // Example CNAME target: {envId}.{zone}
  const verification_cname = `verify-${crypto.randomUUID()}.preview`; // placeholder token
  const { rows } = await pool.query(
    'insert into domains (env_id, hostname, type, verification_cname, verification_status) values ($1,$2,$3,$4,$5) returning *',
    [input.envId, input.hostname, input.type, verification_cname, 'pending']
  );
  return reply.code(201).send(rows[0]);
});

const port = Number(process.env.PORT ?? 3001);
app.listen({ port, host: '0.0.0.0' }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
