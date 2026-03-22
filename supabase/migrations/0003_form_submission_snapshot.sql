-- Full validated JSON snapshot of the public application form (individuals, adviser, preferences, entities).
alter table public.applications
add column if not exists form_submission jsonb;

comment on column public.applications.form_submission is 'Complete submitted form payload for admin review and audit.';
