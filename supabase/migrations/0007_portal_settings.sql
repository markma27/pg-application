-- Singleton portal configuration (notification recipient, etc.).

create table if not exists public.portal_settings (
  id smallint primary key default 1 check (id = 1),
  notification_recipient_email text,
  updated_at timestamptz not null default now ()
);

insert into public.portal_settings (id, notification_recipient_email)
values (1, null)
on conflict (id) do nothing;

alter table public.portal_settings enable row level security;

drop policy if exists "Admins select portal_settings" on public.portal_settings;

create policy "Admins select portal_settings" on public.portal_settings for
select
  to authenticated using (public.is_active_admin (auth.uid ()));

drop policy if exists "Admins update portal_settings" on public.portal_settings;

create policy "Admins update portal_settings" on public.portal_settings for
update
  to authenticated using (public.is_active_admin (auth.uid ()))
with
  check (public.is_active_admin (auth.uid ()));
