-- Create productions table
create table if not exists public.productions (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null,
  name text not null,
  description text,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.productions enable row level security;

-- Trigger to keep updated_at in sync (reuses existing function)
create or replace trigger trg_productions_updated_at
before update on public.productions
for each row
execute function public.update_updated_at_column();

-- Policies
-- Anyone can view productions (needed for showing production info on parties)
create policy if not exists "Anyone can view productions"
  on public.productions for select
  using (true);

-- Only admins can insert productions
create policy if not exists "Admins can create productions"
  on public.productions for insert
  with check (has_role(auth.uid(), 'admin'::public.app_role));

-- Only admins or the creator can update/delete productions
create policy if not exists "Admins or creator can update productions"
  on public.productions for update
  using (has_role(auth.uid(), 'admin'::public.app_role) or auth.uid() = created_by);

create policy if not exists "Admins or creator can delete productions"
  on public.productions for delete
  using (has_role(auth.uid(), 'admin'::public.app_role) or auth.uid() = created_by);

-- Add production_id to parties and set FK
alter table public.parties
  add column if not exists production_id uuid;

alter table public.parties
  add constraint if not exists parties_production_id_fkey
  foreign key (production_id)
  references public.productions(id)
  on delete set null;

-- Create storage bucket for production logos
insert into storage.buckets (id, name, public)
values ('production-logos', 'production-logos', true)
on conflict (id) do nothing;

-- Storage policies for production logos
-- Public can read logos
create policy if not exists "Public can read production logos"
  on storage.objects for select
  using (bucket_id = 'production-logos');

-- Admins can upload their logos
create policy if not exists "Admins can upload production logos"
  on storage.objects for insert
  with check (bucket_id = 'production-logos' and has_role(auth.uid(), 'admin'::public.app_role));

-- Admins can update logos
create policy if not exists "Admins can update production logos"
  on storage.objects for update
  using (bucket_id = 'production-logos' and has_role(auth.uid(), 'admin'::public.app_role));

-- Admins can delete logos
create policy if not exists "Admins can delete production logos"
  on storage.objects for delete
  using (bucket_id = 'production-logos' and has_role(auth.uid(), 'admin'::public.app_role));
