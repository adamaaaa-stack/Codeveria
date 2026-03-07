import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { logWorkspaceActivity } from "@/lib/workspace-activity";
import type {
  Workspace,
  WorkspaceMessage,
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
  await logWorkspaceActivity(inserted.id, "workspace_created", "Workspace created");
  return { workspace: inserted as Workspace };
}

/** Get the most recent workspace for a conversation (for backward compatibility). */
export async function getWorkspaceForConversation(
  conversationId: string,
  userId: string
): Promise<Workspace | null> {
  const workspaces = await getWorkspacesForConversation(conversationId, userId);
  return workspaces.length > 0 ? workspaces[0] : null;
}

/** Get all workspaces for a conversation (newest first). Enables multiple projects with the same person. */
export async function getWorkspacesForConversation(
  conversationId: string,
  userId: string
): Promise<Workspace[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.filter(
    (w) => w.company_id === userId || w.student_id === userId
  ) as Workspace[];
}

export async function sendWorkspaceForConfirmation(
  workspaceId: string,
  userId: string
): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: w } = await supabase.from("workspaces").select("company_id, status").eq("id", workspaceId).single();
  if (!w || w.company_id !== userId) return { error: "Unauthorized" };
  if (w.status !== "draft") return { error: "Workspace is not in draft" };

  await supabase.from("workspaces").update({ status: "awaiting_student_confirmation" }).eq("id", workspaceId);
  await logWorkspaceActivity(workspaceId, "student_invited", "Workspace sent to student for confirmation");
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

  await supabase.from("workspaces").update({ status: "active" }).eq("id", workspaceId);
  await logWorkspaceActivity(workspaceId, "student_accepted", "Student accepted the workspace");
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
  return {};
}

export async function completeWorkspace(
  workspaceId: string,
  userId: string
): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: w } = await supabase.from("workspaces").select("company_id, student_id, title, description, tech_stack, status").eq("id", workspaceId).single();
  if (!w || w.company_id !== userId) return { error: "Unauthorized" };
  if (w.status !== "active") return { error: "Workspace must be active to complete" };

  await supabase.from("workspaces").update({ status: "completed" }).eq("id", workspaceId);

  const service = createServiceRoleClient();
  await service.from("verified_projects").insert({
    developer_id: w.student_id,
    workspace_id: workspaceId,
    title: w.title,
    description: w.description,
    tech_stack: w.tech_stack?.length ? w.tech_stack : [],
  });
  await logWorkspaceActivity(workspaceId, "workspace_completed", "Workspace marked complete");
  return {};
}

export async function leaveWorkspaceReview(
  workspaceId: string,
  userId: string,
  input: { rating: number; review_text?: string | null }
): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: w } = await supabase.from("workspaces").select("company_id, student_id, status").eq("id", workspaceId).single();
  if (!w || w.company_id !== userId) return { error: "Unauthorized" };
  if (w.status !== "completed") return { error: "Workspace must be completed to leave a review" };
  if (input.rating < 1 || input.rating > 5) return { error: "Rating must be 1–5" };

  const { error } = await supabase.from("workspace_reviews").upsert(
    {
      workspace_id: workspaceId,
      company_id: userId,
      developer_id: w.student_id,
      rating: input.rating,
      review_text: input.review_text?.trim() || null,
    },
    { onConflict: "workspace_id" }
  );
  if (error) return { error: error.message };
  return {};
}

export async function getWorkspaceReview(workspaceId: string): Promise<{ rating: number; review_text: string | null } | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("workspace_reviews")
    .select("rating, review_text")
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  return data as { rating: number; review_text: string | null } | null;
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

