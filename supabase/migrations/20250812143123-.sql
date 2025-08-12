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

-- Update timestamp trigger to auto-update updated_at
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_productions_updated_at
before update on public.productions
for each row execute function public.update_updated_at_column();

-- Policies: Everyone can view productions; admins can manage
create policy if not exists "Everyone can view productions"
  on public.productions for select
  using (true);

create policy if not exists "Admins can insert productions"
  on public.productions for insert
  with check (has_role(auth.uid(), 'admin'::public.app_role) and auth.uid() = created_by);

create policy if not exists "Admins can update productions"
  on public.productions for update
  using (has_role(auth.uid(), 'admin'::public.app_role) and auth.uid() = created_by);

create policy if not exists "Admins can delete productions"
  on public.productions for delete
  using (has_role(auth.uid(), 'admin'::public.app_role) and auth.uid() = created_by);

-- Add production_id to parties
alter table public.parties add column if not exists production_id uuid;

-- Optional: index for faster joins
create index if not exists idx_parties_production_id on public.parties(production_id);
