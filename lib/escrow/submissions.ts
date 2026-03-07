/**
 * Code escrow: submission CRUD, review, and code release.
 * Payments are handled externally; code unlocks when both company and developer confirm payment.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { logWorkspaceActivity } from "@/lib/workspace-activity";
import type { SubmissionStatus } from "@/lib/types";

const CODE_BUCKET = "code_submissions";

/** Create submission (developer). Status = 'submitted'. */
export async function createSubmission(
  userId: string,
  input: {
    workspace_id: string;
    repo_url?: string | null;
    preview_url?: string | null;
    description?: string | null;
  }
): Promise<{ submission: { id: string; status: string } } | { error: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) return { error: "Unauthorized" };

  const { data: w } = await supabase
    .from("workspaces")
    .select("id, student_id")
    .eq("id", input.workspace_id)
    .single();
  if (!w || w.student_id !== user.id) return { error: "Only the workspace developer can submit" };

  const { data: sub, error } = await supabase
    .from("submissions")
    .insert({
      workspace_id: input.workspace_id,
      developer_id: user.id,
      repo_url: input.repo_url?.trim() || null,
      preview_url: input.preview_url?.trim() || null,
      description: input.description?.trim() || null,
      status: "submitted",
    })
    .select("id, status")
    .single();

  if (error) return { error: error.message };
  if (!sub) return { error: "Failed to create submission" };
  return { submission: { id: sub.id, status: sub.status } };
}

/** Company reviews: approve (create escrow, status approved → payment_required) or reject (under_review). */
export async function reviewSubmission(
  userId: string,
  input: {
    submission_id: string;
    approved: boolean;
    review_notes?: string | null;
  }
): Promise<{ submission: { id: string; status: string } } | { error: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) return { error: "Unauthorized" };

  const { data: sub } = await supabase
    .from("submissions")
    .select("id, workspace_id, status")
    .eq("id", input.submission_id)
    .single();
  if (!sub) return { error: "Submission not found" };

  const { data: w } = await supabase
    .from("workspaces")
    .select("company_id")
    .eq("id", sub.workspace_id)
    .single();
  if (!w || w.company_id !== user.id) return { error: "Only the company can review" };

  if (sub.status !== "submitted" && sub.status !== "preview_ready" && sub.status !== "preview_building" && sub.status !== "under_review") {
    return { error: "Submission is not in a reviewable state" };
  }

  const service = createServiceRoleClient();

  const { error: reviewError } = await supabase.from("submission_reviews").insert({
    submission_id: input.submission_id,
    company_id: user.id,
    approved: input.approved,
    review_notes: input.review_notes?.trim() || null,
  });
  if (reviewError) return { error: reviewError.message };

  if (input.approved) {
    const newStatus: SubmissionStatus = "payment_required";
    await service.from("submissions").update({ status: newStatus }).eq("id", input.submission_id);
    await service.from("escrow_records").upsert(
      {
        submission_id: input.submission_id,
        code_access_granted: false,
        company_payment_confirmed: false,
        developer_payment_confirmed: false,
      },
      { onConflict: "submission_id" }
    );
    return { submission: { id: sub.id, status: newStatus } };
  }

  await service.from("submissions").update({ status: "under_review" }).eq("id", input.submission_id);
  return { submission: { id: sub.id, status: "under_review" } };
}

/**
 * Release code: set code_access_granted when both company and developer have confirmed payment.
 * Called after either confirmation; unlocks only when both flags are true.
 */
export async function releaseCode(
  submissionId: string
): Promise<{ released: true } | { error: string }> {
  const service = createServiceRoleClient();

  const { data: escrow } = await service
    .from("escrow_records")
    .select("id, company_payment_confirmed, developer_payment_confirmed, code_access_granted")
    .eq("submission_id", submissionId)
    .single();

  if (!escrow) return { error: "Escrow record not found" };
  if (escrow.code_access_granted) {
    return { released: true };
  }
  if (!escrow.company_payment_confirmed || !escrow.developer_payment_confirmed) {
    return { error: "Both parties must confirm payment before code is released" };
  }

  const now = new Date().toISOString();
  const { data: sub } = await service
    .from("submissions")
    .select("workspace_id")
    .eq("id", submissionId)
    .single();

  await service
    .from("escrow_records")
    .update({
      code_access_granted: true,
      released_at: now,
    })
    .eq("submission_id", submissionId);

  await service
    .from("submissions")
    .update({ status: "delivered" })
    .eq("id", submissionId);

  if (sub?.workspace_id) {
    await logWorkspaceActivity(sub.workspace_id, "code_unlocked", "Code access granted");
  }
  return { released: true };
}

/**
 * Generate a signed download URL for the submission source.
 * Only if escrow_records.code_access_granted = true. Server-side only.
 */
export async function getDownloadUrl(
  submissionId: string,
  requestorUserId: string
): Promise<{ url: string } | { error: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== requestorUserId) return { error: "Unauthorized" };

  const { data: sub } = await supabase
    .from("submissions")
    .select("id, workspace_id, code_storage_path")
    .eq("id", submissionId)
    .single();
  if (!sub || !sub.code_storage_path) return { error: "Submission or code path not found" };

  const { data: w } = await supabase
    .from("workspaces")
    .select("company_id, student_id")
    .eq("id", sub.workspace_id)
    .single();
  if (!w) return { error: "Workspace not found" };
  if (w.company_id !== user.id && w.student_id !== user.id) {
    return { error: "Not a participant of this workspace" };
  }

  const service = createServiceRoleClient();
  const { data: escrow } = await service
    .from("escrow_records")
    .select("code_access_granted")
    .eq("submission_id", submissionId)
    .single();

  if (!escrow || !escrow.code_access_granted) {
    return { error: "Code locked until both parties confirm payment." };
  }

  const { data: signed } = await service.storage
    .from(CODE_BUCKET)
    .createSignedUrl(sub.code_storage_path, 300);

  if (signed?.signedUrl) return { url: signed.signedUrl };
  return { error: "Failed to generate download URL" };
}

/** Get submissions for a workspace (for UI). */
export async function getSubmissionsForWorkspace(
  workspaceId: string,
  userId: string
): Promise<
  Array<{
    id: string;
    status: string;
    repo_url: string | null;
    preview_url: string | null;
    description: string | null;
    code_storage_path: string | null;
    created_at: string;
    preview_status?: string | null;
    preview_deployment_id?: string | null;
    preview_error?: string | null;
    escrow?: {
      code_access_granted: boolean;
      company_payment_confirmed: boolean;
      developer_payment_confirmed: boolean;
    } | null;
  }>
> {
  const supabase = await createServerSupabaseClient();
  const { data: w } = await supabase
    .from("workspaces")
    .select("id")
    .eq("id", workspaceId)
    .or(`company_id.eq.${userId},student_id.eq.${userId}`)
    .single();
  if (!w) return [];

  const { data: rows } = await supabase
    .from("submissions")
    .select("id, status, repo_url, preview_url, description, code_storage_path, created_at, preview_status, preview_deployment_id, preview_error")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (!rows?.length) return [];

  const submissionIds = rows.map((r) => r.id);
  const { data: escrows } = await supabase
    .from("escrow_records")
    .select("submission_id, code_access_granted, company_payment_confirmed, developer_payment_confirmed")
    .in("submission_id", submissionIds);

  const escrowBySub = new Map(
    (escrows ?? []).map((e: { submission_id: string; code_access_granted: boolean; company_payment_confirmed: boolean; developer_payment_confirmed: boolean }) => [
      e.submission_id,
      { code_access_granted: e.code_access_granted, company_payment_confirmed: e.company_payment_confirmed, developer_payment_confirmed: e.developer_payment_confirmed },
    ])
  );

  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    repo_url: r.repo_url ?? null,
    preview_url: r.preview_url ?? null,
    description: r.description ?? null,
    code_storage_path: r.code_storage_path ?? null,
    created_at: r.created_at,
    preview_status: (r as { preview_status?: string }).preview_status ?? null,
    preview_deployment_id: (r as { preview_deployment_id?: string }).preview_deployment_id ?? null,
    preview_error: (r as { preview_error?: string }).preview_error ?? null,
    escrow: escrowBySub.get(r.id) ?? null,
  }));
}

/** Company confirms they have sent payment. Sets company_payment_confirmed; unlocks code if developer already confirmed. */
export async function confirmPaymentCompany(
  submissionId: string,
  userId: string
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) return { error: "Unauthorized" };

  const { data: sub } = await supabase
    .from("submissions")
    .select("id, workspace_id")
    .eq("id", submissionId)
    .single();
  if (!sub) return { error: "Submission not found" };

  const { data: w } = await supabase
    .from("workspaces")
    .select("company_id")
    .eq("id", sub.workspace_id)
    .single();
  if (!w || w.company_id !== user.id) return { error: "Only the company can confirm payment sent" };

  const service = createServiceRoleClient();
  const { error: updateError } = await service
    .from("escrow_records")
    .update({ company_payment_confirmed: true })
    .eq("submission_id", submissionId);
  if (updateError) return { error: updateError.message };

  const releaseResult = await releaseCode(submissionId);
  if (releaseResult && "error" in releaseResult && releaseResult.error !== "Both parties must confirm payment before code is released") {
    return { error: releaseResult.error };
  }
  return { ok: true };
}

/** Developer confirms they have received payment. Sets developer_payment_confirmed; unlocks code if company already confirmed. */
export async function confirmPaymentDeveloper(
  submissionId: string,
  userId: string
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) return { error: "Unauthorized" };

  const { data: sub } = await supabase
    .from("submissions")
    .select("id, developer_id")
    .eq("id", submissionId)
    .single();
  if (!sub) return { error: "Submission not found" };
  if (sub.developer_id !== user.id) return { error: "Only the developer can confirm payment received" };

  const service = createServiceRoleClient();
  const { error: updateError } = await service
    .from("escrow_records")
    .update({ developer_payment_confirmed: true })
    .eq("submission_id", submissionId);
  if (updateError) return { error: updateError.message };

  const releaseResult = await releaseCode(submissionId);
  if (releaseResult && "error" in releaseResult && releaseResult.error !== "Both parties must confirm payment before code is released") {
    return { error: releaseResult.error };
  }
  return { ok: true };
}

/** Update submission with code_storage_path after upload. */
export async function setSubmissionCodePath(
  submissionId: string,
  developerUserId: string,
  storagePath: string
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== developerUserId) return { error: "Unauthorized" };

  const { data: sub } = await supabase
    .from("submissions")
    .select("id, developer_id")
    .eq("id", submissionId)
    .single();
  if (!sub || sub.developer_id !== user.id) return { error: "Not your submission" };

  const { error } = await supabase
    .from("submissions")
    .update({ code_storage_path: storagePath })
    .eq("id", submissionId);
  if (error) return { error: error.message };
  return { ok: true };
}
