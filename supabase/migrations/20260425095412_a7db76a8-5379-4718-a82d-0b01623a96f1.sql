-- ID verifications table
create table public.id_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  status text not null default 'not_started', -- not_started | pending | approved | rejected
  legal_first_name text,
  legal_middle_name text,
  legal_last_name text,
  date_of_birth date,
  ssn_last4 text,
  address_line1 text,
  address_line2 text,
  city text,
  state_region text,
  postal_code text,
  country text,
  phone text,
  document_type text, -- drivers_license | passport | state_id | residence_permit
  document_number text,
  document_country text,
  document_state text,
  document_expires date,
  id_front_path text,
  id_back_path text,
  selfie_path text,
  rejection_reason text,
  reviewer_notes text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.id_verifications enable row level security;

create policy "users view own verification"
on public.id_verifications for select to authenticated
using (auth.uid() = user_id or has_role(auth.uid(), 'admin'));

create policy "users insert own verification"
on public.id_verifications for insert to authenticated
with check (auth.uid() = user_id);

create policy "users update own verification"
on public.id_verifications for update to authenticated
using (auth.uid() = user_id and status in ('not_started','rejected','pending'))
with check (auth.uid() = user_id);

create policy "admins update verification"
on public.id_verifications for update to authenticated
using (has_role(auth.uid(), 'admin'))
with check (has_role(auth.uid(), 'admin'));

create trigger trg_id_ver_updated_at
before update on public.id_verifications
for each row execute function public.tg_set_updated_at();

-- Storage bucket (private)
insert into storage.buckets (id, name, public)
values ('id-verification', 'id-verification', false)
on conflict (id) do nothing;

create policy "users upload own id docs"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'id-verification'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "users read own id docs"
on storage.objects for select to authenticated
using (
  bucket_id = 'id-verification'
  and ((storage.foldername(name))[1] = auth.uid()::text or has_role(auth.uid(), 'admin'))
);

create policy "users update own id docs"
on storage.objects for update to authenticated
using (
  bucket_id = 'id-verification'
  and (storage.foldername(name))[1] = auth.uid()::text
);
