-- Application pipeline: Pending → In Progress → Documents Sent → Completed

update public.applications
set status = 'pending'
where lower(trim(status)) in ('new', 'pending');

update public.applications
set status = 'in_progress'
where trim(status) = 'In Progress';

update public.applications
set status = 'completed'
where trim(status) in ('Processed', 'completed');

-- Any remaining unknown values default to pending
update public.applications
set status = 'pending'
where status is null
   or status not in ('pending', 'in_progress', 'documents_sent', 'completed');

alter table public.applications
  alter column status set default 'pending';

alter table public.applications
  drop constraint if exists applications_status_workflow_check;

alter table public.applications
  add constraint applications_status_workflow_check check (
    status in ('pending', 'in_progress', 'documents_sent', 'completed')
  );

comment on column public.applications.status is 'Workflow: pending | in_progress | documents_sent | completed';
