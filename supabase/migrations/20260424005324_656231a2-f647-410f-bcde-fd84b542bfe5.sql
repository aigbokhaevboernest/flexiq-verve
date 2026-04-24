
create or replace function public.handle_owner_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email = 'tqxminingpool@gmail.com' then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_owner_admin on auth.users;
create trigger on_auth_user_owner_admin
  after insert on auth.users
  for each row execute function public.handle_owner_admin();
