-- skills: lookup table for skill names
create table public.skills (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null
);

-- profile_skills: skills attached to a profile (developer)
create table public.profile_skills (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  self_reported_level text,
  created_at timestamptz default now(),
  unique(profile_id, skill_id)
);

-- developer_stats: aggregated stats for developer profile display
create table public.developer_stats (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  completed_projects_count int default 0,
  on_time_completion_rate numeric default 0,
  average_rating numeric default 0,
  level text default 'Beginner',
  updated_at timestamptz default now()
);

-- portfolio_items: project portfolio for developers
create table public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  tech_stack text[] default '{}',
  project_url text,
  github_url text,
  image_url text,
  created_at timestamptz default now()
);

-- reviews: reviews of developers (by companies)
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check (rating >= 1 and rating <= 5),
  review text,
  created_at timestamptz default now()
);

-- RLS: skills (public read)
alter table public.skills enable row level security;
create policy "Public read skills"
  on public.skills for select
  using (true);

-- RLS: profile_skills
alter table public.profile_skills enable row level security;
create policy "Public read profile_skills"
  on public.profile_skills for select
  using (true);
create policy "Profile owner manage profile_skills"
  on public.profile_skills for all
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- RLS: developer_stats (public read; update by platform only = no anon/authenticated update policy)
alter table public.developer_stats enable row level security;
create policy "Public read developer_stats"
  on public.developer_stats for select
  using (true);

-- RLS: portfolio_items
alter table public.portfolio_items enable row level security;
create policy "Public read portfolio_items"
  on public.portfolio_items for select
  using (true);
create policy "Profile owner manage portfolio_items"
  on public.portfolio_items for all
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- RLS: reviews
alter table public.reviews enable row level security;
create policy "Public read reviews"
  on public.reviews for select
  using (true);
create policy "Authenticated users can insert reviews"
  on public.reviews for insert
  with check (auth.uid() = reviewer_id);

-- Seed skills
insert into public.skills (slug, name) values
  ('react', 'React'),
  ('next-js', 'Next.js'),
  ('typescript', 'TypeScript'),
  ('node-js', 'Node.js'),
  ('python', 'Python'),
  ('sql', 'SQL'),
  ('supabase', 'Supabase'),
  ('tailwind-css', 'Tailwind CSS'),
  ('swift', 'Swift'),
  ('flutter', 'Flutter'),
  ('django', 'Django'),
  ('fastapi', 'FastAPI');
