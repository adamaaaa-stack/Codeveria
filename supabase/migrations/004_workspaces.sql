-- workspaces: one per conversation, created by company
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null unique references public.conversations(id) on delete cascade,
  company_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,

  title text not null,
  description text not null,
  tech_stack text[] not null default '{}',
  total_budget int not null check (total_budget > 0),

  status text not null check (
    status in (
      'draft',
      'awaiting_student_confirmation',
      'funding_required',
      'active',
      'completed',
      'cancelled',
      'disputed'
    )
  ) default 'draft',

  start_date date,
  end_date date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- workspace_messages: chat within a workspace
create table public.workspace_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

-- milestones: ordered deliverables
create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,

  order_index int not null,
  title text not null,
  description text,
  amount int not null check (amount > 0),
  due_date date,

  status text not null check (
    status in (
      'draft',
      'pending_student_confirmation',
      'active',
      'submitted',
      'approved',
      'rejected',
      'paid',
      'cancelled'
    )
  ) default 'draft',

  submission_notes text,
  submitted_at timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(workspace_id, order_index)
);

-- updated_at triggers (reuse existing function from 001)
create trigger workspaces_updated_at
  before update on public.workspaces
  for each row execute function public.set_updated_at();

create trigger milestones_updated_at
  before update on public.milestones
  for each row execute function public.set_updated_at();

-- RLS: workspaces
alter table public.workspaces enable row level security;

create policy "Participants can select workspace"
  on public.workspaces for select
  using (auth.uid() = company_id or auth.uid() = student_id);

create policy "Company can insert workspace for own conversation"
  on public.workspaces for insert
  with check (auth.uid() = company_id);

create policy "Participants can update workspace"
  on public.workspaces for update
  using (auth.uid() = company_id or auth.uid() = student_id);

-- RLS: workspace_messages
alter table public.workspace_messages enable row level security;

create policy "Participants can select workspace_messages"
  on public.workspace_messages for select
  using (
    exists (
      select 1 from public.workspaces w
      where w.id = workspace_id and (w.company_id = auth.uid() or w.student_id = auth.uid())
    )
  );

create policy "Participants can insert workspace_message as sender"
  on public.workspace_messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.workspaces w
      where w.id = workspace_id and (w.company_id = auth.uid() or w.student_id = auth.uid())
    )
  );

create policy "Participants can update read_at on workspace_messages"
  on public.workspace_messages for update
  using (
    exists (
      select 1 from public.workspaces w
      where w.id = workspace_id and (w.company_id = auth.uid() or w.student_id = auth.uid())
    )
  );

-- RLS: milestones
alter table public.milestones enable row level security;

create policy "Participants can select milestones"
  on public.milestones for select
  using (
    exists (
      select 1 from public.workspaces w
      where w.id = workspace_id and (w.company_id = auth.uid() or w.student_id = auth.uid())
    )
  );

create policy "Company can insert milestones in own workspace"
  on public.milestones for insert
  with check (
    exists (
      select 1 from public.workspaces w
      where w.id = workspace_id and w.company_id = auth.uid()
    )
  );

create policy "Company can update milestones in own workspace"
  on public.milestones for update
  using (
    exists (
      select 1 from public.workspaces w
      where w.id = workspace_id and w.company_id = auth.uid()
    )
  );

create policy "Company can delete milestones in own workspace"
  on public.milestones for delete
  using (
    exists (
      select 1 from public.workspaces w
      where w.id = workspace_id and w.company_id = auth.uid()
    )
  );

-- Realtime for workspace chat
alter publication supabase_realtime add table public.workspace_messages;
