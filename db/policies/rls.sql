-- Enable Row Level Security and policies for multi-tenant isolation
alter table orgs enable row level security;
alter table projects enable row level security;
alter table environments enable row level security;
alter table secrets enable row level security;
alter table env_vars enable row level security;

-- Example: assume a session variable app.current_org set by API
create policy org_isolation on orgs
  using (true);

create policy project_isolation on projects
  using (exists (
    select 1 from orgs o where o.id = projects.org_id
  ));

create policy env_isolation on environments
  using (exists (
    select 1 from projects p where p.id = environments.project_id
  ));

create policy secrets_env_isolation on secrets
  using (exists (
    select 1 from environments e where e.id = secrets.env_id
  ));

create policy env_vars_env_isolation on env_vars
  using (exists (
    select 1 from environments e where e.id = env_vars.env_id
  ));
