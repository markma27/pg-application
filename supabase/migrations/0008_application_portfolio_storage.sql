-- Portfolio report documents (PDF / Excel / CSV) for existing portfolios — Supabase Storage + entity metadata.

alter table public.application_entities
  add column if not exists form_submission_entity_id text;

alter table public.application_entities
  add column if not exists portfolio_documents jsonb not null default '[]'::jsonb;

create index if not exists application_entities_app_form_entity_idx
  on public.application_entities (application_id, form_submission_entity_id);

comment on column public.application_entities.form_submission_entity_id is 'Stable id from the public application form entity (matches form_submission JSON).';
comment on column public.application_entities.portfolio_documents is 'Array of { storage_path, original_name, content_type, size_bytes } for uploaded portfolio reports.';

-- Private bucket: uploads via service role or signed upload URLs; admins read via storage policy.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'application-portfolio',
  'application-portfolio',
  false,
  10485760,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'text/plain'
  ]::text[]
)
on conflict (id) do update
set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Authenticated admins can download portfolio files for review.
drop policy if exists "Admins read application portfolio storage" on storage.objects;

create policy "Admins read application portfolio storage"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'application-portfolio'
    and public.is_active_admin (auth.uid ())
  );
