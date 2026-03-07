create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary_contact_name text not null,
  email text not null,
  phone text not null,
  applicant_role text not null,
  adviser_details text,
  group_name text,
  status text not null default 'New',
  overall_outcome text not null default 'manual_review',
  notification_email_sent boolean not null default false,
  notification_email_sent_at timestamptz,
  notification_email_error text,
  internal_owner text,
  internal_notes text,
  follow_up_status text,
  quote_status text,
  reviewed_at timestamptz,
  reviewed_by uuid
);

create table if not exists public.application_entities (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  entity_name text not null,
  entity_type text not null,
  portfolio_status text not null,
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
  indicative_annual_fee numeric(12,2),
  indicative_onboarding_fee numeric(12,2),
  pricing_status text not null
);

create table if not exists public.entity_services (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.application_entities(id) on delete cascade,
  service_code text not null,
  service_label text not null
);

create table if not exists public.application_pricing_summary (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications(id) on delete cascade,
  pg_annual_subtotal numeric(12,2) not null default 0,
  pg_onboarding_subtotal numeric(12,2) not null default 0,
  group_discount_amount numeric(12,2) not null default 0,
  pg_total_estimate numeric(12,2),
  contains_jm_entities boolean not null default false,
  manual_review_required boolean not null default true
);

create table if not exists public.admin_users (
  id uuid primary key,
  email text not null unique,
  full_name text not null,
  role text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);
