-- Speed up global audit log listing (order by created_at desc).

create index if not exists application_audit_events_created_at_idx
  on public.application_audit_events (created_at desc);
