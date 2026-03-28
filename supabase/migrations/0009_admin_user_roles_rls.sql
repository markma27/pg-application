-- Portal roles: admin (invite/remove users) vs general (same app access, no user management).
-- Self-service profile: authenticated users may update only their own full_name (enforced by trigger).

alter table public.admin_users
  drop constraint if exists admin_users_role_check;

alter table public.admin_users
  add constraint admin_users_role_check 
  check (role in ('admin', 'general'));

create or replace function public.is_admin_portal_role (uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.id = uid
      and au.is_active
      and au.role = 'admin'
  );
$$;

create or replace function public.admin_users_before_update ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Self-service updates only allow full_name to change (email is auth identity; role/active managed by admins).
  if auth.uid () is not null
     and new.id = auth.uid ()
     and old.id = auth.uid () then
    if new.role is distinct from old.role
       or new.email is distinct from old.email
       or new.is_active is distinct from old.is_active then
      raise exception 'Not allowed to change role, email, or active status';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_admin_users_before_update on public.admin_users;

create trigger trg_admin_users_before_update
before update on public.admin_users
for each row
execute function public.admin_users_before_update ();

drop policy if exists "Users update own profile" on public.admin_users;

create policy "Users update own profile"
  on public.admin_users
  for update
  to authenticated
  using (id = auth.uid () and public.is_active_admin (auth.uid ()))
  with check (id = auth.uid () and public.is_active_admin (auth.uid ()));
