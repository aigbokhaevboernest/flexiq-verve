create table public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id) on delete set null,
  actor_email text,
  target_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index idx_admin_actions_target on public.admin_actions(target_user_id);
create index idx_admin_actions_created on public.admin_actions(created_at desc);
create index idx_admin_actions_actor on public.admin_actions(actor_id);

alter table public.admin_actions enable row level security;

create policy "admins view audit log"
  on public.admin_actions for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- No insert/update/delete policies — only service role (edge functions) can write.