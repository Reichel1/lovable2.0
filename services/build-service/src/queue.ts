import { Queue, Worker, QueueEvents, JobsOptions } from 'bullmq';
import IORedis from 'ioredis';

export const redis = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379');

export interface BuildJobData {
  buildId: string;
  projectId: string;
  projectSlug: string;
  repoSlug: string;
  gitRef: string;
}

export const buildQueue = new Queue<BuildJobData>('builds', {
  connection: redis,
  defaultJobOptions: { attempts: 2, backoff: { type: 'exponential', delay: 5000 } } as JobsOptions,
});
