
-- Workflow engine tables
create table if not exists public.workflow_tasks (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  parent_reference text not null,
  workflow_key text not null,
  stage text not null,
  step_index integer not null default 0,
  assignee_role text not null,
  assignee_user uuid,
  status text not null default 'Pending',
  priority text not null default 'Normal',
  sla_hours integer not null default 24,
  due_at timestamptz not null default (now() + interval '24 hours'),
  started_at timestamptz,
  completed_at timestamptz,
  comment text,
  data jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_workflow_tasks_status on public.workflow_tasks(status);
create index if not exists idx_workflow_tasks_module on public.workflow_tasks(module);
create index if not exists idx_workflow_tasks_parent on public.workflow_tasks(parent_reference);
create index if not exists idx_workflow_tasks_assignee on public.workflow_tasks(assignee_user);

alter table public.workflow_tasks enable row level security;

create policy "wf_tasks_read_auth" on public.workflow_tasks for select to authenticated using (true);
create policy "wf_tasks_insert_auth" on public.workflow_tasks for insert to authenticated with check (auth.uid() = created_by);
create policy "wf_tasks_update_auth" on public.workflow_tasks for update to authenticated using (true);
create policy "wf_tasks_delete_auth" on public.workflow_tasks for delete to authenticated using (auth.uid() = created_by);

create trigger trg_wf_tasks_updated before update on public.workflow_tasks
  for each row execute function public.set_updated_at();

create table if not exists public.workflow_audit (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.workflow_tasks(id) on delete cascade,
  parent_reference text not null,
  module text not null,
  actor uuid,
  actor_name text,
  action text not null,
  from_stage text,
  to_stage text,
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists idx_wf_audit_parent on public.workflow_audit(parent_reference);
create index if not exists idx_wf_audit_task on public.workflow_audit(task_id);

alter table public.workflow_audit enable row level security;

create policy "wf_audit_read_auth" on public.workflow_audit for select to authenticated using (true);
create policy "wf_audit_insert_auth" on public.workflow_audit for insert to authenticated with check (true);
