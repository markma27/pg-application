-- Shared indicative pricing model for the calculator (one row, all portal users).

create table if not exists public.pricing_calculator_settings (
  id smallint primary key default 1 check (id = 1),
  -- JSON string (Infinity in bands encoded as "__INF__" like localStorage).
  model_json text not null default '{}',
  updated_at timestamptz not null default now (),
  updated_by uuid references auth.users (id) on delete set null
);

insert into public.pricing_calculator_settings (id, model_json)
values (1, '{}')
on conflict (id) do nothing;

alter table public.pricing_calculator_settings enable row level security;

drop policy if exists "Active admins select pricing_calculator_settings" on public.pricing_calculator_settings;

create policy "Active admins select pricing_calculator_settings" on public.pricing_calculator_settings for
select
  to authenticated using (public.is_active_admin (auth.uid ()));

drop policy if exists "Active admins insert pricing_calculator_settings" on public.pricing_calculator_settings;

create policy "Active admins insert pricing_calculator_settings" on public.pricing_calculator_settings for insert to authenticated
with
  check (public.is_active_admin (auth.uid ()));

drop policy if exists "Active admins update pricing_calculator_settings" on public.pricing_calculator_settings;

create policy "Active admins update pricing_calculator_settings" on public.pricing_calculator_settings for
update
  to authenticated using (public.is_active_admin (auth.uid ()))
with
  check (public.is_active_admin (auth.uid ()));
