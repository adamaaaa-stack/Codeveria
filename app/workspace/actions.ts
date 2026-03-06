"use server";

import { revalidatePath } from "next/cache";
import {
  createWorkspaceFromConversation,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  sendWorkspaceForConfirmation,
  studentAcceptWorkspace,
  studentRequestWorkspaceChanges,
  submitMilestone,
  approveMilestone,
} from "@/lib/workspaces";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function createWorkspaceAction(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const conversation_id = (formData.get("conversation_id") as string)?.trim();
  const student_id = (formData.get("student_id") as string)?.trim();
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const techStackStr = (formData.get("tech_stack") as string)?.trim();
  const total_budget = parseInt(formData.get("total_budget") as string, 10);
  const start_date = (formData.get("start_date") as string)?.trim() || null;
  const end_date = (formData.get("end_date") as string)?.trim() || null;

  if (!conversation_id || !student_id || !title || !description) {
    return { error: "Title and description are required" };
  }
  if (isNaN(total_budget) || total_budget <= 0) {
    return { error: "Total budget must be a positive number" };
  }
  if (start_date && end_date && end_date < start_date) {
    return { error: "End date cannot be before start date" };
  }

  const tech_stack = techStackStr ? techStackStr.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean) : [];

  const result = await createWorkspaceFromConversation({
    conversation_id,
    company_id: user.id,
    student_id,
    title,
    description,
    tech_stack,
    total_budget,
    start_date,
    end_date,
  });

  if ("error" in result) return result;
  revalidatePath("/messages");
  revalidatePath(`/workspace/${result.workspace.id}`);
  return { workspaceId: result.workspace.id };
}

export async function createMilestoneAction(
  formData: FormData
): Promise<{ error: string } | Record<string, never>> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const workspace_id = (formData.get("workspace_id") as string)?.trim();
  const order_index = parseInt(formData.get("order_index") as string, 10) || 0;
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const amount = parseInt(formData.get("amount") as string, 10);
  const due_date = (formData.get("due_date") as string)?.trim() || null;

  if (!workspace_id || !title) return { error: "Title is required" };
  if (isNaN(amount) || amount <= 0) return { error: "Amount must be positive" };

  const result = await createMilestone({
    workspace_id,
    order_index,
    title,
    description,
    amount,
    due_date,
    userId: user.id,
  });
  if ("error" in result) return result;
  revalidatePath(`/workspace/${workspace_id}`);
  return {};
}

export async function updateMilestoneAction(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const milestoneId = (formData.get("milestone_id") as string)?.trim();
  const workspace_id = (formData.get("workspace_id") as string)?.trim();
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const amountStr = formData.get("amount") as string;
  const amount = amountStr ? parseInt(amountStr, 10) : undefined;
  const due_date = (formData.get("due_date") as string)?.trim() || null;
  const order_indexStr = formData.get("order_index") as string;
  const order_index = order_indexStr ? parseInt(order_indexStr, 10) : undefined;

  if (!milestoneId || !workspace_id) return { error: "Missing ids" };
  if (amount !== undefined && (isNaN(amount) || amount <= 0)) return { error: "Amount must be positive" };

  const result = await updateMilestone({
    milestoneId,
    workspace_id,
    title: title || undefined,
    description,
    amount,
    due_date,
    order_index,
    userId: user.id,
  });
  if ("error" in result) return result;
  revalidatePath(`/workspace/${workspace_id}`);
  return {};
}

export async function deleteMilestoneAction(milestoneId: string, workspaceId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const result = await deleteMilestone(milestoneId, user.id);
  if (result.error) return result;
  revalidatePath(`/workspace/${workspaceId}`);
  return {};
}

export async function sendForConfirmationAction(workspaceId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const result = await sendWorkspaceForConfirmation(workspaceId, user.id);
  if (result.error) return result;
  revalidatePath(`/workspace/${workspaceId}`);
  return {};
}

export async function studentAcceptAction(workspaceId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const result = await studentAcceptWorkspace(workspaceId, user.id);
  if (result.error) return result;
  revalidatePath(`/workspace/${workspaceId}`);
  return {};
}

export async function studentRequestChangesAction(workspaceId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const result = await studentRequestWorkspaceChanges(workspaceId, user.id);
  if (result.error) return result;
  revalidatePath(`/workspace/${workspaceId}`);
  return {};
}

export async function submitMilestoneAction(milestoneId: string, workspaceId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const result = await submitMilestone(milestoneId, workspaceId, user.id);
  if (result.error) return result;
  revalidatePath(`/workspace/${workspaceId}`);
  return {};
}

export async function approveMilestoneAction(milestoneId: string, workspaceId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const result = await approveMilestone(milestoneId, workspaceId, user.id);
  if (result.error) return result;
  revalidatePath(`/workspace/${workspaceId}`);
  return {};
}
