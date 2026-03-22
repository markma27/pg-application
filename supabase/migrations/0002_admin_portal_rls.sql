-- Row Level Security for the admin portal (Supabase Auth JWT + admin_users).
-- Apply after 0001_initial_schema.sql.
-- Service-role API calls bypass RLS for public form submissions.

create or replace function public.is_active_admin (uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.id = uid
      and au.is_active
  );
$$;

alter table public.applications enable row level security;
alter table public.application_entities enable row level security;
alter table public.entity_services enable row level security;
alter table public.application_pricing_summary enable row level security;
alter table public.admin_users enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists "Admins select applications" on public.applications;
create policy "Admins select applications"
  on public.applications
  for select
  to authenticated
  using (public.is_active_admin (auth.uid ()));

drop policy if exists "Admins update applications" on public.applications;
create policy "Admins update applications"
  on public.applications
  for update
  to authenticated
  using (public.is_active_admin (auth.uid ()))
  with check (public.is_active_admin (auth.uid ()));

drop policy if exists "Admins select application_entities" on public.application_entities;
create policy "Admins select application_entities"
  on public.application_entities
  for select
  to authenticated
  using (public.is_active_admin (auth.uid ()));

drop policy if exists "Admins select entity_services" on public.entity_services;
create policy "Admins select entity_services"
  on public.entity_services
  for select
  to authenticated
  using (
    public.is_active_admin (auth.uid ())
    and exists (
      select 1
      from public.application_entities ae
      where ae.id = entity_id
    )
  );

drop policy if exists "Admins select application_pricing_summary" on public.application_pricing_summary;
create policy "Admins select application_pricing_summary"
  on public.application_pricing_summary
  for select
  to authenticated
  using (public.is_active_admin (auth.uid ()));

drop policy if exists "Admins read admin_users" on public.admin_users;
create policy "Admins read admin_users"
  on public.admin_users
  for select
  to authenticated
  using (public.is_active_admin (auth.uid ()));

drop policy if exists "Admins read audit_log" on public.audit_log;
create policy "Admins read audit_log"
  on public.audit_log
  for select
  to authenticated
  using (public.is_active_admin (auth.uid ()));

drop policy if exists "Admins insert audit_log" on public.audit_log;
create policy "Admins insert audit_log"
  on public.audit_log
  for insert
  to authenticated
  with check (public.is_active_admin (auth.uid ()));

/*
  Manual setup:
  1. Authentication → create a user (email/password).
  2. insert into public.admin_users (id, email, full_name, role)
     values ('<auth user uuid>', 'you@company.com', 'Your Name', 'admin');
  3. Sign in at /admin/login.
*/
