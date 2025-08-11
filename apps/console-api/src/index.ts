import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { z } from 'zod';
import pg from 'pg';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import crypto from 'node:crypto';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const buildQueue = new Queue('builds', { connection: { url: process.env.REDIS_URL ?? 'redis://localhost:6379' } });

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
  const { rows } = await pool.query(`
    select p.id,
           p.org_id as "orgId",
           p.name,
           p.runtime_type as "runtimeType",
           p.region,
           (select b.status from builds b where b.project_id=p.id order by b.created_at desc limit 1) as "latestBuildStatus",
           (select b.artifact_manifest_url from builds b where b.project_id=p.id and b.status='succeeded' order by b.created_at desc limit 1) as "latestArtifactManifestUrl"
      from projects p
     order by p.created_at desc
     limit 100
  `);
  return rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    runtime_type: r.runtimeType,
    latest_build_status: r.latestBuildStatus,
    latest_preview_url: r.latestArtifactManifestUrl ? r.latestArtifactManifestUrl.replace(/\/manifest\.json$/, '') : null,
  }));
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
    'select id, status, branch, pr_number as "prNumber", created_at as "createdAt", finished_at as "finishedAt", artifact_manifest_url as "artifactManifestUrl", logs_url as "logsUrl" from builds where project_id = $1 order by created_at desc limit 50',
    [projectId]
  );
  return rows.map((r: any) => ({
    id: r.id,
    status: r.status,
    branch: r.branch,
    pr_number: r.prNumber,
    created_at: r.createdAt,
    finished_at: r.finishedAt,
    artifact_manifest_url: r.artifactManifestUrl,
    logs_url: r.logsUrl,
  }));
});

// Domains by project
app.get('/projects/:id/domains', async (req) => {
  const projectId = (req.params as any).id as string;
  const { rows } = await pool.query(
    `select d.id, d.hostname, d.verification_status as "verificationStatus", d.verification_cname as "verificationCname"
       from domains d
       join environments e on e.id = d.env_id
      where e.project_id = $1
      order by d.hostname asc`,
    [projectId]
  );
  return rows.map((r: any) => ({
    id: r.id,
    hostname: r.hostname,
    verification_status: r.verificationStatus,
    verification_cname: r.verificationCname,
  }));
});

app.get('/deployments', async () => {
  const { rows } = await pool.query(
    'select id, env_id as "envId", build_id as "buildId", strategy, canary_percent as "canaryPercent", status, promoted_at as "promotedAt", rolled_back_from as "rolledBackFrom" from deployments order by created_at desc limit 50'
  );
  return rows;
});

// Enqueue build from API
const StartBuildInput = z.object({ projectId: z.string().uuid(), projectSlug: z.string(), repoSlug: z.string(), gitRef: z.string().default('main') });
app.post('/builds:start', async (req, reply) => {
  const input = StartBuildInput.parse(req.body);
  const buildId = crypto.randomUUID();
  await pool.query('insert into builds (id, project_id, git_ref, status, created_at) values ($1,$2,$3,$4,now())', [
    buildId,
    input.projectId,
    input.gitRef,
    'queued',
  ]);
  await buildQueue.add('build', {
    buildId,
    projectId: input.projectId,
    projectSlug: input.projectSlug,
    repoSlug: input.repoSlug,
    gitRef: input.gitRef,
  });
  return reply.code(202).send({ id: buildId, status: 'queued' });
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

// Domain verification: checks CF DNS
app.get('/domains/:id/verify', async (req) => {
  const id = (req.params as any).id as string;
  const { rows } = await pool.query('select d.id, d.hostname, d.verification_cname, o.id as zone_id from domains d join environments e on e.id=d.env_id join projects p on p.id=e.project_id join orgs o on true where d.id=$1', [id]);
  if (rows.length === 0) return { status: 'not_found' };
  const domain = rows[0] as { id: string; hostname: string; verification_cname: string };
  const zoneId = process.env.CLOUDFLARE_ZONE_ID!;
  const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?type=CNAME&name=${encodeURIComponent(domain.hostname)}`, {
    headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}` },
  });
  const json: any = await res.json();
  const content = json?.result?.[0]?.content as string | undefined;
  if (content && domain.verification_cname && content.includes(domain.verification_cname)) {
    await pool.query('update domains set verification_status=$1, verified_at=now() where id=$2', ['verified', id]);
    return { status: 'verified' };
  }
  return { status: 'pending' };
});

const port = Number(process.env.PORT ?? 3001);
app.listen({ port, host: '0.0.0.0' }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
