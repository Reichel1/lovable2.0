create table if not exists repos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  provider text not null check (provider in ('github')),
  repo_slug text not null,
  created_at timestamptz default now()
);
create unique index if not exists repos_provider_slug_idx on repos(provider, repo_slug);
