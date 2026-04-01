alter table public.applications
  add column if not exists postal_address text;

comment on column public.applications.postal_address is 'Primary applicant postal address from contact step (also in form_submission JSON).';
