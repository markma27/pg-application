-- PortfolioGuardian application storage — aligned with packages/shared ApplicationInput + assessment.
-- Order: admin_users first (applications.assignee_id references it).

create table if not exists public.admin_users (
  id uuid primary key,
  email text not null unique,
  full_name text not null,
  role text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid (),
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now (),
  reference text not null,
  primary_contact_name text not null,
  email text not null,
  phone text not null,
  applicant_role text not null,
  adviser_details text,
  group_name text,
  services_comments text,
  status text not null default 'New',
  overall_outcome text not null default 'manual_review',
  notification_email_sent boolean not null default false,
  notification_email_sent_at timestamptz,
  notification_email_error text,
  assignee_id uuid references public.admin_users (id) on delete set null,
  deleted_at timestamptz,
  sla_due_at timestamptz,
  constraint applications_overall_outcome_check check (
    overall_outcome in ('pg_fit', 'jm_fit', 'manual_review')
  ),
  constraint applications_reference_unique unique (reference)
);

create table if not exists public.application_entities (
  id uuid primary key default gen_random_uuid (),
  application_id uuid not null references public.applications (id) on delete cascade,
  entity_name text not null,
  entity_type text not null,
  portfolio_status text not null,
  portfolio_hin text,
  abn text,
  tfn text,
  registered_for_gst boolean,
  listed_investment_count integer not null default 0,
  unlisted_investment_count integer not null default 0,
  property_count integer not null default 0,
  wrap_count integer not null default 0,
  other_assets_text text,
  has_crypto boolean not null default false,
  has_foreign_investments boolean not null default false,
  service_start_date text not null,
  routing_outcome text not null,
  complexity_points integer not null default 0,
  indicative_annual_fee numeric(12, 2),
  indicative_onboarding_fee numeric(12, 2),
  pricing_status text not null
);

create table if not exists public.entity_services (
  id uuid primary key default gen_random_uuid (),
  entity_id uuid not null references public.application_entities (id) on delete cascade,
  service_code text not null,
  service_label text not null
);

create table if not exists public.application_pricing_summary (
  id uuid primary key default gen_random_uuid (),
  application_id uuid not null unique references public.applications (id) on delete cascade,
  pg_annual_subtotal numeric(12, 2) not null default 0,
  pg_onboarding_subtotal numeric(12, 2) not null default 0,
  group_discount_amount numeric(12, 2) not null default 0,
  pg_total_estimate numeric(12, 2),
  contains_jm_entities boolean not null default false,
  manual_review_required boolean not null default true
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid (),
  created_at timestamptz not null default now (),
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb
);

create index if not exists audit_log_created_at_idx on public.audit_log (created_at desc);

-- Human-readable references: PG-100001, PG-100002, …
create sequence if not exists public.application_reference_seq start with 100001;

create or replace function public.set_application_defaults ()
returns trigger
language plpgsql
as $$
begin
  if new.reference is null or btrim(new.reference) = '' then
    new.reference := 'PG-' || lpad(nextval('public.application_reference_seq')::text, 6, '0');
  end if;
  if new.sla_due_at is null then
    new.sla_due_at := now() + interval '14 days';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_applications_defaults on public.applications;

create trigger trg_applications_defaults
before insert on public.applications
for each row
execute function public.set_application_defaults ();

create or replace function public.touch_applications_updated_at ()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_applications_updated_at on public.applications;

create trigger trg_applications_updated_at
before update on public.applications
for each row
execute function public.touch_applications_updated_at ();
