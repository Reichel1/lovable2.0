-- Core identity & tenancy
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  oidc_subject text unique,
  name text,
  created_at timestamptz default now()
);

create table if not exists orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  billing_account_id text,
  created_at timestamptz default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,
  runtime_type text not null check (runtime_type in ('static','edge','container')),
  region text not null,
  created_at timestamptz default now()
);

create table if not exists environments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  key text not null check (key in ('dev','preview','stage','prod')),
  logical_schema text not null,
  feature_flags jsonb not null default '{}',
  created_at timestamptz default now()
);

-- Secrets & env vars
create table if not exists secrets (
  id uuid primary key default gen_random_uuid(),
  env_id uuid not null references environments(id) on delete cascade,
  key text not null,
  value_ciphertext bytea not null,
  scope text not null check (scope in ('build','runtime','tool')),
  version int not null default 1,
  rotated_at timestamptz
);

create table if not exists env_vars (
  id uuid primary key default gen_random_uuid(),
  env_id uuid not null references environments(id) on delete cascade,
  key text not null,
  value_plain text not null,
  source text not null check (source in ('user','system')),
  version int not null default 1
);

-- Builds & artifacts
create table if not exists builds (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  git_ref text not null,
  status text not null check (status in ('queued','running','succeeded','failed')),
  logs_url text,
  artifact_manifest_url text,
  created_by uuid references users(id),
  created_at timestamptz default now()
);

create table if not exists artifacts (
  id uuid primary key default gen_random_uuid(),
  build_id uuid not null references builds(id) on delete cascade,
  path text not null,
  hash text not null,
  size bigint not null,
  media_type text,
  immutable_url text
);

-- Deployments
create table if not exists deployments (
  id uuid primary key default gen_random_uuid(),
  env_id uuid not null references environments(id) on delete cascade,
  build_id uuid not null references builds(id) on delete cascade,
  strategy text not null check (strategy in ('canary','blue','green')),
  canary_percent int not null default 0 check (canary_percent between 0 and 100),
  status text not null check (status in ('pending','progressing','healthy','rolled_back','failed')),
  promoted_at timestamptz,
  rolled_back_from uuid references deployments(id),
  created_at timestamptz default now()
);

-- Domains & certs
create table if not exists domains (
  id uuid primary key default gen_random_uuid(),
  env_id uuid not null references environments(id) on delete cascade,
  hostname text not null,
  type text not null check (type in ('default','custom')),
  verification_cname text,
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','failed')),
  verified_at timestamptz,
  health_status text not null default 'unknown' check (health_status in ('unknown','healthy','degraded','down'))
);

create table if not exists certs (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references domains(id) on delete cascade,
  issuer text not null,
  not_before timestamptz not null,
  not_after timestamptz not null,
  status text not null,
  acme_challenge text,
  acme_type text check (acme_type in ('http-01','dns-01')),
  renewal_attempts int not null default 0
);

-- Automation
create table if not exists flows (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  graph jsonb not null,
  status text not null default 'draft'
);

create table if not exists flow_runs (
  id uuid primary key default gen_random_uuid(),
  flow_id uuid not null references flows(id) on delete cascade,
  input jsonb,
  status text not null,
  started_at timestamptz default now(),
  finished_at timestamptz,
  error text
);

create table if not exists flow_steps (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references flow_runs(id) on delete cascade,
  node_id text not null,
  status text not null,
  timings jsonb,
  logs_url text,
  retries int not null default 0
);

-- Agents & tools
create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  role text not null,
  enabled boolean not null default true,
  policy_id uuid
);

create table if not exists tools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  version text not null,
  schema jsonb not null,
  scopes text[] not null
);

create table if not exists grants (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references agents(id) on delete cascade,
  tool_id uuid not null references tools(id) on delete cascade,
  scopes text[] not null,
  expires_at timestamptz
);

create table if not exists approvals (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid references users(id),
  agent_id uuid references agents(id),
  tool_id uuid references tools(id),
  payload jsonb,
  status text not null check (status in ('pending','approved','rejected')) default 'pending',
  reason text,
  created_at timestamptz default now()
);

-- Observability & audit
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  subject_id uuid,
  payload jsonb,
  created_at timestamptz default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor text not null,
  action text not null,
  inputs jsonb,
  outputs jsonb,
  diff_url text,
  created_at timestamptz default now()
);

create table if not exists model_spend (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references agents(id),
  model text not null,
  tokens_in int not null,
  tokens_out int not null,
  cost_usd numeric(12,4) not null,
  run_id uuid,
  created_at timestamptz default now()
);
