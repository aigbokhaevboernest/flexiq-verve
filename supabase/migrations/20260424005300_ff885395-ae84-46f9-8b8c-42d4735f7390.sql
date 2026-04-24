
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

-- Promote admin (only if user exists)
insert into public.user_roles (user_id, role)
select id, 'admin'::app_role from auth.users where email = 'tqxminingpool@gmail.com'
on conflict do nothing;
