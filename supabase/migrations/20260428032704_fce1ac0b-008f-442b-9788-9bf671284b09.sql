-- Tickets
create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  category text not null default 'general',
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  status text not null default 'open' check (status in ('open','pending','resolved','closed')),
  assigned_to uuid references auth.users(id) on delete set null,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_tickets_user on public.support_tickets(user_id);
create index idx_tickets_status on public.support_tickets(status);
create index idx_tickets_last_msg on public.support_tickets(last_message_at desc);

alter table public.support_tickets enable row level security;

create policy "users view own tickets"
  on public.support_tickets for select to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

create policy "users create own tickets"
  on public.support_tickets for insert to authenticated
  with check (auth.uid() = user_id);

create policy "admins update tickets"
  on public.support_tickets for update to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create trigger tg_tickets_updated_at
  before update on public.support_tickets
  for each row execute function public.set_updated_at();

-- Messages
create table public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete set null,
  body text not null,
  internal boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_ticket_messages_ticket on public.support_ticket_messages(ticket_id, created_at);

alter table public.support_ticket_messages enable row level security;

-- Owner of the ticket can see public messages; admins see everything.
create policy "view ticket messages"
  on public.support_ticket_messages for select to authenticated
  using (
    public.has_role(auth.uid(), 'admin')
    or (
      not internal
      and exists (
        select 1 from public.support_tickets t
        where t.id = ticket_id and t.user_id = auth.uid()
      )
    )
  );

-- Owner can post non-internal messages on own tickets; admins can post anything.
create policy "post ticket messages"
  on public.support_ticket_messages for insert to authenticated
  with check (
    author_id = auth.uid()
    and (
      public.has_role(auth.uid(), 'admin')
      or (
        internal = false
        and exists (
          select 1 from public.support_tickets t
          where t.id = ticket_id and t.user_id = auth.uid()
        )
      )
    )
  );

-- Bump ticket last_message_at + reopen if user replies on a resolved ticket
create or replace function public.tg_bump_ticket()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid;
  v_status text;
begin
  select user_id, status into v_owner, v_status from public.support_tickets where id = new.ticket_id;
  update public.support_tickets
    set last_message_at = new.created_at,
        status = case
          when new.author_id = v_owner and v_status in ('resolved','pending') then 'open'
          when new.author_id <> v_owner and v_status = 'open' then 'pending'
          else status
        end
    where id = new.ticket_id;
  return new;
end $$;

create trigger tg_bump_ticket_after_message
  after insert on public.support_ticket_messages
  for each row execute function public.tg_bump_ticket();