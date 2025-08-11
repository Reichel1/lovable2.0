import { z } from 'zod';

export const IdSchema = z.string().uuid();

export const ProjectSchema = z.object({
  id: IdSchema,
  orgId: IdSchema,
  name: z.string().min(1),
  runtimeType: z.enum(['static', 'edge', 'container']),
  region: z.string().min(1),
});
export type Project = z.infer<typeof ProjectSchema>;

export const EnvironmentSchema = z.object({
  id: IdSchema,
  projectId: IdSchema,
  key: z.enum(['dev', 'preview', 'stage', 'prod']),
  logicalSchema: z.string(),
  featureFlags: z.record(z.string(), z.any()),
});
export type Environment = z.infer<typeof EnvironmentSchema>;

export const BuildSchema = z.object({
  id: IdSchema,
  projectId: IdSchema,
  gitRef: z.string(),
  status: z.enum(['queued', 'running', 'succeeded', 'failed']),
  logsUrl: z.string().url().optional(),
  artifactManifestUrl: z.string().url().optional(),
  createdBy: IdSchema.optional(),
});
export type Build = z.infer<typeof BuildSchema>;

export const DeploymentSchema = z.object({
  id: IdSchema,
  envId: IdSchema,
  buildId: IdSchema,
  strategy: z.enum(['canary', 'blue', 'green']),
  canaryPercent: z.number().int().min(0).max(100).default(0),
  status: z.enum(['pending', 'progressing', 'healthy', 'rolled_back', 'failed']),
  promotedAt: z.string().datetime().optional(),
  rolledBackFrom: IdSchema.optional(),
});
export type Deployment = z.infer<typeof DeploymentSchema>;

export const DomainSchema = z.object({
  id: IdSchema,
  envId: IdSchema,
  hostname: z.string(),
  type: z.enum(['default', 'custom']),
  verificationCname: z.string().optional(),
  verifiedAt: z.string().datetime().optional(),
  healthStatus: z.enum(['unknown', 'healthy', 'degraded', 'down']).default('unknown'),
});
export type Domain = z.infer<typeof DomainSchema>;
