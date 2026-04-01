-- Extra asset-count fields for complexity (mirrors form entity JSON + pricing model).
alter table public.application_entities
  add column if not exists bank_account_count integer not null default 0,
  add column if not exists foreign_bank_account_count integer not null default 0,
  add column if not exists loan_count integer not null default 0,
  add column if not exists cryptocurrency_count integer not null default 0;

comment on column public.application_entities.bank_account_count is 'Estimated count for pricing complexity (default complexity weight in model).';
comment on column public.application_entities.foreign_bank_account_count is 'Estimated count for pricing complexity.';
comment on column public.application_entities.loan_count is 'Estimated count for pricing complexity.';
comment on column public.application_entities.cryptocurrency_count is 'Estimated count for pricing complexity (separate from has_crypto flag).';
