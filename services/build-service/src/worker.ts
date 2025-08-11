import { Worker } from 'bullmq';
import { redis, BuildJobData } from './queue';
import simpleGit from 'simple-git';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import path from 'node:path';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import os from 'node:os';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CF_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: process.env.CF_R2_ACCESS_KEY_ID && process.env.CF_R2_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.CF_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CF_R2_SECRET_ACCESS_KEY!,
  } : undefined,
});

async function run(cmd: string, args: string[], cwd: string, log: (s: string) => void) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', (d) => log(d.toString()));
    child.stderr.on('data', (d) => log(d.toString()));
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

async function detectBuild(dir: string): Promise<{ outDir: string; commands: [string, string[]][] }> {
  const pkgRaw = await fs.readFile(path.join(dir, 'package.json'), 'utf8');
  const pkg = JSON.parse(pkgRaw);
  if (pkg.dependencies?.next || pkg.devDependencies?.next) {
    return { outDir: '.next/static', commands: [['pnpm', ['install']], ['pnpm', ['build']]] };
  }
  if (pkg.scripts?.build && pkg.devDependencies?.vite) {
    return { outDir: 'dist', commands: [['pnpm', ['install']], ['pnpm', ['build']]] };
  }
  // fallback
  return { outDir: 'dist', commands: [['pnpm', ['install']], ['pnpm', ['build']]] };
}

async function* walk(dir: string): AsyncGenerator<string> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.isFile()) {
      yield full;
    }
  }
}

function contentTypeFor(file: string): string {
  const ext = path.extname(file).toLowerCase();
  switch (ext) {
    case '.html': return 'text/html; charset=utf-8';
    case '.js': return 'application/javascript';
    case '.css': return 'text/css; charset=utf-8';
    case '.json': return 'application/json';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.svg': return 'image/svg+xml';
    case '.webp': return 'image/webp';
    case '.ico': return 'image/x-icon';
    default: return 'application/octet-stream';
  }
}

function rel(from: string, file: string) { return file.substring(from.length).replace(/^\//, ''); }

export const worker = new Worker<BuildJobData>('builds', async (job) => {
  const { projectSlug, repoSlug, gitRef, buildId } = job.data;
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'build-'));
  const repoUrl = `https://github.com/${repoSlug}.git`;
  const git = simpleGit();

  let logs = '';
  const log = (s: string) => { logs += s; };

  await git.clone(repoUrl, tmp, ['--depth=1']);
  await git.cwd({ path: tmp, root: false }).checkout(gitRef);

  const { outDir, commands } = await detectBuild(tmp);
  for (const [cmd, args] of commands) {
    await run(cmd, args, tmp, log);
  }

  // Upload artifacts
  const baseKey = `${projectSlug}/${buildId}`;
  for await (const file of walk(path.join(tmp, outDir))) {
    const key = `${baseKey}/${rel(path.join(tmp, outDir), file)}`;
    const body = await fs.readFile(file);
    await r2.send(new PutObjectCommand({
      Bucket: process.env.CF_R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentTypeFor(file),
      CacheControl: /\.(?:css|js|png|jpg|jpeg|svg|webp|ico)$/.test(file) ? 'public, max-age=31536000, immutable' : 'public, max-age=60, s-maxage=600',
    }));
  }

  const manifest = JSON.stringify({ id: buildId, outDir });
  await r2.send(new PutObjectCommand({
    Bucket: process.env.CF_R2_BUCKET,
    Key: `${baseKey}/manifest.json`,
    Body: manifest,
    ContentType: 'application/json',
  }));

  await r2.send(new PutObjectCommand({
    Bucket: process.env.CF_R2_BUCKET,
    Key: `${baseKey}/build.log`,
    Body: logs,
    ContentType: 'text/plain; charset=utf-8',
  }));

  // TODO: update DB row with success and URLs
}, { connection: redis });
