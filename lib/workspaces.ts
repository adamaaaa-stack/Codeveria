import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  Workspace,
  WorkspaceMessage,
  Milestone,
  WorkspaceWithParticipants,
  ParticipantSummary,
} from "@/lib/types";

export async function getWorkspaceById(
  workspaceId: string,
  userId: string
): Promise<WorkspaceWithParticipants | null> {
  const supabase = await createServerSupabaseClient();
  const { data: w, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .single();
  if (error || !w) return null;
  if (w.company_id !== userId && w.student_id !== userId) return null;

  const [companyRes, studentRes] = await Promise.all([
    supabase.from("profiles").select("id, display_name, role, avatar_url").eq("id", w.company_id).single(),
    supabase.from("profiles").select("id, display_name, role, avatar_url").eq("id", w.student_id).single(),
  ]);

  const company: ParticipantSummary = companyRes.data
    ? { id: companyRes.data.id, display_name: companyRes.data.display_name, role: companyRes.data.role, avatar_url: companyRes.data.avatar_url }
    : { id: w.company_id, display_name: null, role: "company", avatar_url: null };
  const student: ParticipantSummary = studentRes.data
    ? { id: studentRes.data.id, display_name: studentRes.data.display_name, role: studentRes.data.role, avatar_url: studentRes.data.avatar_url }
    : { id: w.student_id, display_name: null, role: "student", avatar_url: null };

  return { ...w, company, student } as WorkspaceWithParticipants;
}

export async function getMilestonesForWorkspace(
  workspaceId: string,
  userId: string
): Promise<Milestone[]> {
  const supabase = await createServerSupabaseClient();
  const { data: w } = await supabase.from("workspaces").select("company_id, student_id").eq("id", workspaceId).single();
  if (!w || (w.company_id !== userId && w.student_id !== userId)) return [];

  const { data, error } = await supabase
    .from("milestones")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("order_index", { ascending: true });
  if (error) return [];
  return (data ?? []) as Milestone[];
}

export async function getWorkspaceMessages(
  workspaceId: string,
  userId: string
): Promise<WorkspaceMessage[]> {
  const supabase = await createServerSupabaseClient();
  const { data: w } = await supabase.from("workspaces").select("id").eq("id", workspaceId).single();
  if (!w) return [];
  const { data: row } = await supabase.from("workspaces").select("company_id, student_id").eq("id", workspaceId).single();
  if (!row || (row.company_id !== userId && row.student_id !== userId)) return [];

  const { data: rows, error } = await supabase
    .from("workspace_messages")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });
  if (error) return [];
  return (rows ?? []) as WorkspaceMessage[];
}

export interface CreateWorkspaceInput {
  conversation_id: string;
  company_id: string;
  student_id: string;
  title: string;
  description: string;
  tech_stack: string[];
  total_budget: number;
  start_date?: string | null;
  end_date?: string | null;
}

export async function createWorkspaceFromConversation(
  input: CreateWorkspaceInput
): Promise<{ workspace: Workspace } | { error: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== input.company_id) return { error: "Unauthorized" };

  const { data: conv } = await supabase
    .from("conversations")
    .select("company_id, student_id")
    .eq("id", input.conversation_id)
    .single();
  if (!conv || conv.company_id !== input.company_id || conv.student_id !== input.student_id)
    return { error: "Invalid conversation" };

  const { data: existing } = await supabase
    .from("workspaces")
    .select("id")
    .eq("conversation_id", input.conversation_id)
    .single();
  if (existing) return { error: "Workspace already exists for this conversation" };

  const { data: inserted, error } = await supabase
    .from("workspaces")
    .insert({
      conversation_id: input.conversation_id,
      company_id: input.company_id,
      student_id: input.student_id,
      title: input.title.trim(),
      description: input.description.trim(),
      tech_stack: input.tech_stack.length ? input.tech_stack : [],
      total_budget: input.total_budget,
      start_date: input.start_date || null,
      end_date: input.end_date || null,
      status: "draft",
    })
    .select("*")
    .single();
  if (error) return { error: error.message };
  return { workspace: inserted as Workspace };
}

export async function getWorkspaceForConversation(
  conversationId: string,
  userId: string
): Promise<Workspace | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("conversation_id", conversationId)
    .single();
  if (error || !data) return null;
  if (data.company_id !== userId && data.student_id !== userId) return null;
  return data as Workspace;
}

export async function createMilestone(input: {
  workspace_id: string;
  order_index: number;
  title: string;
  description?: string | null;
  amount: number;
  due_date?: string | null;
  userId: string;
}): Promise<{ milestone: Milestone } | { error: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: w } = await supabase.from("workspaces").select("company_id, status").eq("id", input.workspace_id).single();
  if (!w || w.company_id !== input.userId) return { error: "Unauthorized" };
  if (w.status !== "draft") return { error: "Can only add milestones in draft" };

  const { data, error } = await supabase
    .from("milestones")
    .insert({
      workspace_id: input.workspace_id,
      order_index: input.order_index,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      amount: input.amount,
      due_date: input.due_date || null,
      status: "draft",
    })
    .select("*")
    .single();
  if (error) return { error: error.message };
  return { milestone: data as Milestone };
}

export async function updateMilestone(input: {
  milestoneId: string;
  workspace_id: string;
  title?: string;
  description?: string | null;
  amount?: number;
  due_date?: string | null;
  order_index?: number;
  userId: string;
}): Promise<{ milestone: Milestone } | { error: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: w } = await supabase.from("workspaces").select("company_id, status").eq("id", input.workspace_id).single();
  if (!w || w.company_id !== input.userId) return { error: "Unauthorized" };
  if (w.status !== "draft") return { error: "Can only edit milestones in draft" };

  const updates: Record<string, unknown> = {};
  if (input.title !== undefined) updates.title = input.title.trim();
  if (input.description !== undefined) updates.description = input.description?.trim() || null;
  if (input.amount !== undefined) updates.amount = input.amount;
  if (input.due_date !== undefined) updates.due_date = input.due_date || null;
  if (input.order_index !== undefined) updates.order_index = input.order_index;
  if (Object.keys(updates).length === 0) {
    const { data } = await supabase.from("milestones").select("*").eq("id", input.milestoneId).single();
    return data ? { milestone: data as Milestone } : { error: "Not found" };
  }

  const { data, error } = await supabase
    .from("milestones")
    .update(updates)
    .eq("id", input.milestoneId)
    .eq("workspace_id", input.workspace_id)
    .select("*")
    .single();
  if (error) return { error: error.message };
  return { milestone: data as Milestone };
}

export async function deleteMilestone(
  milestoneId: string,
  userId: string
): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: m } = await supabase.from("milestones").select("workspace_id").eq("id", milestoneId).single();
  if (!m) return { error: "Not found" };
  const { data: w } = await supabase.from("workspaces").select("company_id, status").eq("id", m.workspace_id).single();
  if (!w || w.company_id !== userId) return { error: "Unauthorized" };
  if (w.status !== "draft") return { error: "Can only delete milestones in draft" };

  const { error } = await supabase.from("milestones").delete().eq("id", milestoneId);
  if (error) return { error: error.message };
  return {};
}

export async function sendWorkspaceForConfirmation(
  workspaceId: string,
  userId: string
): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: w } = await supabase.from("workspaces").select("company_id, status, total_budget").eq("id", workspaceId).single();
  if (!w || w.company_id !== userId) return { error: "Unauthorized" };
  if (w.status !== "draft") return { error: "Workspace is not in draft" };

  const { data: milestones } = await supabase.from("milestones").select("amount, id").eq("workspace_id", workspaceId);
  const total = (milestones ?? []).reduce((s, m) => s + Number(m.amount), 0);
  if (total !== Number(w.total_budget)) return { error: "Milestone total must equal workspace budget" };
  if ((milestones ?? []).length === 0) return { error: "Add at least one milestone" };

  await supabase.from("workspaces").update({ status: "awaiting_student_confirmation" }).eq("id", workspaceId);
  await supabase.from("milestones").update({ status: "pending_student_confirmation" }).eq("workspace_id", workspaceId);
  return {};
}

export async function studentAcceptWorkspace(
  workspaceId: string,
  userId: string
): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: w } = await supabase.from("workspaces").select("student_id, status").eq("id", workspaceId).single();
  if (!w || w.student_id !== userId) return { error: "Unauthorized" };
  if (w.status !== "awaiting_student_confirmation") return { error: "Invalid status" };

  await supabase.from("workspaces").update({ status: "funding_required" }).eq("id", workspaceId);
  await supabase.from("milestones").update({ status: "active" }).eq("workspace_id", workspaceId);
  return {};
}

export async function studentRequestWorkspaceChanges(
  workspaceId: string,
  userId: string
): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: w } = await supabase.from("workspaces").select("student_id, status").eq("id", workspaceId).single();
  if (!w || w.student_id !== userId) return { error: "Unauthorized" };
  if (w.status !== "awaiting_student_confirmation") return { error: "Invalid status" };

  await supabase.from("workspaces").update({ status: "draft" }).eq("id", workspaceId);
  await supabase.from("milestones").update({ status: "draft" }).eq("workspace_id", workspaceId);
  return {};
}

export async function markWorkspaceMessagesRead(
  workspaceId: string,
  currentUserId: string
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { data: w } = await supabase.from("workspaces").select("id").eq("id", workspaceId).or(`company_id.eq.${currentUserId},student_id.eq.${currentUserId}`).single();
  if (!w) return;
  await supabase
    .from("workspace_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("workspace_id", workspaceId)
    .neq("sender_id", currentUserId)
    .is("read_at", null);
}
