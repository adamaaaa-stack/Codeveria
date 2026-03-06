"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { Milestone, WorkspaceWithParticipants } from "@/lib/types";
import {
  sendForConfirmationAction,
  studentAcceptAction,
  studentRequestChangesAction,
  deleteMilestoneAction,
} from "@/app/workspace/actions";
import { CreateMilestoneDialog } from "./CreateMilestoneDialog";
import { Pencil, Trash2, Plus } from "lucide-react";

interface MilestoneListProps {
  workspace: WorkspaceWithParticipants;
  milestones: Milestone[];
  currentUserId: string;
}

export function MilestoneList({
  workspace,
  milestones,
  currentUserId,
}: MilestoneListProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isCompany = workspace.company_id === currentUserId;
  const allocated = milestones.reduce((s, m) => s + m.amount, 0);
  const remaining = workspace.total_budget - allocated;
  const canSendForConfirmation =
    isCompany &&
    workspace.status === "draft" &&
    milestones.length > 0 &&
    allocated === workspace.total_budget;

  async function handleSendForConfirmation() {
    setActionError(null);
    const result = await sendForConfirmationAction(workspace.id);
    if (result && "error" in result && typeof result.error === "string") setActionError(result.error);
    else window.location.reload();
  }

  async function handleStudentAccept() {
    setActionError(null);
    const result = await studentAcceptAction(workspace.id);
    if (result && "error" in result && typeof result.error === "string") setActionError(result.error);
    else window.location.reload();
  }

  async function handleStudentRequestChanges() {
    setActionError(null);
    const result = await studentRequestChangesAction(workspace.id);
    if (result && "error" in result && typeof result.error === "string") setActionError(result.error);
    else window.location.reload();
  }

  async function handleDelete(milestoneId: string) {
    if (!confirm("Delete this milestone?")) return;
    setActionError(null);
    const result = await deleteMilestoneAction(milestoneId, workspace.id);
    if (result && "error" in result && typeof result.error === "string") setActionError(result.error);
    else window.location.reload();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Milestones</CardTitle>
        {isCompany && workspace.status === "draft" && (
          <Button size="sm" className="gap-2" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4" />
            Add milestone
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total budget</span>
            <span className="font-medium">{workspace.total_budget}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Allocated to milestones</span>
            <span className="font-medium">{allocated}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Remaining</span>
            <span className="font-medium">{remaining}</span>
          </div>
          {milestones.length > 0 && allocated !== workspace.total_budget && (
            <p className="mt-2 text-amber-600">
              Milestone total must equal workspace budget to send for confirmation.
            </p>
          )}
        </div>

        {actionError && <p className="text-sm text-destructive">{actionError}</p>}

        {workspace.status === "awaiting_student_confirmation" && !isCompany && (
          <div className="flex gap-2">
            <Button size="sm" onClick={handleStudentAccept}>
              Accept workspace
            </Button>
            <Button size="sm" variant="outline" onClick={handleStudentRequestChanges}>
              Request changes
            </Button>
          </div>
        )}

        {canSendForConfirmation && (
          <Button size="sm" onClick={handleSendForConfirmation}>
            Send workspace to student for confirmation
          </Button>
        )}

        {milestones.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No milestones yet. Add milestones when the workspace is in draft.
          </p>
        ) : (
          <ul className="space-y-3">
            {milestones.map((m) => (
              <li key={m.id} className="flex items-start justify-between rounded-lg border border-border p-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{m.title}</span>
                    <Badge variant="secondary">{m.status.replace(/_/g, " ")}</Badge>
                  </div>
                  {m.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>
                  )}
                  <p className="mt-1 text-sm">
                    Amount: {m.amount}
                    {m.due_date && ` · Due ${m.due_date}`}
                  </p>
                </div>
                {isCompany && workspace.status === "draft" && (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingId(m.id)}
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(m.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      {showAddDialog && (
        <CreateMilestoneDialog
          workspaceId={workspace.id}
          orderIndex={milestones.length}
          onSuccess={() => window.location.reload()}
          onCancel={() => setShowAddDialog(false)}
        />
      )}

      {editingId && (
        <EditMilestoneInline
          milestone={milestones.find((m) => m.id === editingId)!}
          workspaceId={workspace.id}
          onDone={() => {
            setEditingId(null);
            window.location.reload();
          }}
          onCancel={() => setEditingId(null)}
        />
      )}
    </Card>
  );
}

function EditMilestoneInline({
  milestone,
  workspaceId,
  onDone,
  onCancel,
}: {
  milestone: Milestone;
  workspaceId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("milestone_id", milestone.id);
    formData.set("workspace_id", workspaceId);
    const { updateMilestoneAction } = await import("@/app/workspace/actions");
    const result = await updateMilestoneAction(formData);
    setLoading(false);
    if (result && "error" in result && typeof result.error === "string") setError(result.error);
    else onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Edit milestone</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input
                name="title"
                defaultValue={milestone.title}
                required
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                name="description"
                defaultValue={milestone.description ?? ""}
                rows={2}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Amount *</label>
              <Input
                name="amount"
                type="number"
                min={1}
                defaultValue={milestone.amount}
                required
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Due date</label>
              <Input
                name="due_date"
                type="date"
                defaultValue={milestone.due_date ?? ""}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving…" : "Save"}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
