-- Profiles table: one row per auth user
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('student','company','admin')),
  onboarding_complete boolean not null default false,

  display_name text,
  avatar_url text,

  university text,
  github_url text,
  bio text,
  preferred_stacks text[] default '{}',

  company_name text,
  company_website text,
  company_description text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger to keep updated_at in sync
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;

-- Users can select their own profile
create policy "Users can select own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can insert their own profile
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Public read for developer/company discovery (only student and company; no sensitive auth data)
create policy "Public read for student and company profiles"
  on public.profiles for select
  using (role in ('student', 'company'));
