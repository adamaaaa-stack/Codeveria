-- Conversations: one row per company-student pair.
-- Validation that company_id has role 'company' and student_id has role 'student'
-- is enforced in application logic (Postgres check would require a trigger or join).
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(company_id, student_id)
);

-- Messages: one row per message in a conversation.
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

-- RLS: conversations
alter table public.conversations enable row level security;

create policy "Users can select own conversations"
  on public.conversations for select
  using (auth.uid() = company_id or auth.uid() = student_id);

create policy "Company can insert conversation"
  on public.conversations for insert
  with check (auth.uid() = company_id);

-- RLS: messages
alter table public.messages enable row level security;

create policy "Users can select messages in their conversations"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.company_id = auth.uid() or c.student_id = auth.uid())
    )
  );

create policy "Users can insert message as sender in their conversation"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.company_id = auth.uid() or c.student_id = auth.uid())
    )
  );

create policy "Users can update read_at on messages in their conversations"
  on public.messages for update
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.company_id = auth.uid() or c.student_id = auth.uid())
    )
  );

-- Realtime: enable for messages so new messages appear live
alter publication supabase_realtime add table public.messages;
