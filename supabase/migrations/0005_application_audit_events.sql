-- Per-application timeline (submission, future status changes, etc.)

create table if not exists public.application_audit_events (
  id uuid primary key default gen_random_uuid (),
  application_id uuid not null references public.applications (id) on delete cascade,
  created_at timestamptz not null default now (),
  event_type text not null,
  actor_type text not null,
  actor_admin_id uuid references public.admin_users (id) on delete set null,
  actor_label text not null,
  detail jsonb,
  constraint application_audit_events_actor_type_check check (
    actor_type in ('applicant', 'admin', 'system')
  )
);

create index if not exists application_audit_events_app_created_idx
  on public.application_audit_events (application_id, created_at asc);

comment on table public.application_audit_events is 'Timeline for an application (e.g. form submitted, status changes).';
comment on column public.application_audit_events.event_type is 'e.g. form_submitted, status_changed';
comment on column public.application_audit_events.actor_label is 'Display string: applicant name/email or admin name';

alter table public.application_audit_events enable row level security;

drop policy if exists "Admins read application_audit_events" on public.application_audit_events;
create policy "Admins read application_audit_events"
  on public.application_audit_events
  for select
  to authenticated
  using (public.is_active_admin (auth.uid ()));

drop policy if exists "Admins insert application_audit_events" on public.application_audit_events;
create policy "Admins insert application_audit_events"
  on public.application_audit_events
  for insert
  to authenticated
  with check (public.is_active_admin (auth.uid ()));

-- Example when wiring status updates from the admin app:
-- insert into public.application_audit_events (application_id, event_type, actor_type, actor_admin_id, actor_label, detail)
-- values ($app_id, 'status_changed', 'admin', $admin_users.id, $admin_display_name, jsonb_build_object('from_status', $old, 'to_status', $new));
