-- Allow multiple workspaces per conversation so the same company and developer
-- can start new projects (new workspaces) after completing previous ones.

alter table public.workspaces
  drop constraint if exists workspaces_conversation_id_key;

create index if not exists idx_workspaces_conversation_id on public.workspaces (conversation_id);
