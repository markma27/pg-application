-- Relational storage for KYC individuals and structured adviser / document preferences.
-- Complements `applications.form_submission` (JSON snapshot) for reporting, exports, and legacy-friendly queries.

-- --- Adviser & document preferences (one row per application, already on `applications`) ---
alter table public.applications add column if not exists adviser_name text;
alter table public.applications add column if not exists adviser_company text;
alter table public.applications add column if not exists adviser_address text;
alter table public.applications add column if not exists adviser_tel text;
alter table public.applications add column if not exists adviser_fax text;
alter table public.applications add column if not exists adviser_email text;
alter table public.applications add column if not exists nominate_adviser_primary_contact boolean;
alter table public.applications add column if not exists authorise_adviser_access_statements boolean;
alter table public.applications add column if not exists authorise_deal_with_adviser_direct boolean;
alter table public.applications add column if not exists annual_report_send_to jsonb;
alter table public.applications add column if not exists meeting_proxy_send_to jsonb;
alter table public.applications add column if not exists investment_offers_send_to jsonb;
alter table public.applications add column if not exists dividend_preference text;

comment on column public.applications.adviser_name is 'Investment adviser name (structured step).';
comment on column public.applications.annual_report_send_to is 'JSON: string[], "not_required", or empty string pattern from form.';

-- --- Individuals (KYC) — one row per person, up to 4 per application ---
create table if not exists public.application_individuals (
  id uuid primary key default gen_random_uuid (),
  application_id uuid not null references public.applications (id) on delete cascade,
  sort_order integer not null default 0,
  form_individual_id text,
  relationship_roles text[] not null,
  title text not null,
  full_name text not null,
  street_address text not null,
  street_address_line2 text,
  tax_file_number text not null,
  date_of_birth text not null,
  country_of_birth text not null,
  city text not null,
  occupation text not null,
  employer text not null,
  email text not null,
  created_at timestamptz not null default now ()
);

create index if not exists application_individuals_application_id_idx on public.application_individuals (application_id);

comment on table public.application_individuals is 'KYC / individual details from the public application form.';

-- RLS (admin read; service role bypasses for API inserts)
alter table public.application_individuals enable row level security;

drop policy if exists "Admins select application_individuals" on public.application_individuals;

create policy "Admins select application_individuals"
  on public.application_individuals
  for select
  to authenticated
  using (public.is_active_admin (auth.uid ()));

drop policy if exists "Admins update application_individuals" on public.application_individuals;

create policy "Admins update application_individuals"
  on public.application_individuals
  for update
  to authenticated
  using (public.is_active_admin (auth.uid ()))
  with check (public.is_active_admin (auth.uid ()));
