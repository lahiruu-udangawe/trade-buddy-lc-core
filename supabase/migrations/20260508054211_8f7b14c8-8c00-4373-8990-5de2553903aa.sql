
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'Officer',
  branch text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_read_auth" on public.profiles for select to authenticated using (true);
create policy "profiles_update_self" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "profiles_insert_self" on public.profiles for insert to authenticated with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Generic updated_at trigger
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- Helper macro: each trade table follows the same shape
do $$ declare t text; tables text[] := array['import_lcs','export_lcs','import_wo_lcs','export_wo_lcs','guarantees']; begin
  foreach t in array tables loop
    execute format($f$
      create table public.%I (
        id uuid primary key default gen_random_uuid(),
        reference text not null unique,
        status text not null default 'Draft',
        currency text,
        amount numeric,
        counterparty text,
        country text,
        data jsonb not null default '{}'::jsonb,
        created_by uuid references auth.users(id) on delete set null,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
      alter table public.%I enable row level security;
      create policy "%I_read_auth" on public.%I for select to authenticated using (true);
      create policy "%I_insert_auth" on public.%I for insert to authenticated with check (auth.uid() = created_by);
      create policy "%I_update_auth" on public.%I for update to authenticated using (auth.uid() = created_by);
      create policy "%I_delete_auth" on public.%I for delete to authenticated using (auth.uid() = created_by);
      create trigger %I_updated before update on public.%I for each row execute function public.set_updated_at();
    $f$, t,t,t,t,t,t,t,t,t,t,t,t);
  end loop;
end $$;

-- SWIFT messages aggregate (cross-module hub)
create table public.swift_messages (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  parent_reference text,
  type text not null,
  direction text not null default 'OUT',
  status text not null default 'Queued',
  reference text not null,
  payload jsonb default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.swift_messages enable row level security;
create policy "swift_read" on public.swift_messages for select to authenticated using (true);
create policy "swift_insert" on public.swift_messages for insert to authenticated with check (auth.uid() = created_by);
