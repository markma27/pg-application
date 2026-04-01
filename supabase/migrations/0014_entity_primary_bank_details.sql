alter table public.application_entities
  add column if not exists has_primary_bank_account boolean not null default false,
  add column if not exists primary_bank_name text,
  add column if not exists primary_bank_account_name text,
  add column if not exists primary_bank_bsb text,
  add column if not exists primary_bank_account_number text;

comment on column public.application_entities.has_primary_bank_account is 'Entity has a primary bank account disclosed on the form.';
comment on column public.application_entities.primary_bank_name is 'Financial institution name (e.g. CBA, ANZ).';
