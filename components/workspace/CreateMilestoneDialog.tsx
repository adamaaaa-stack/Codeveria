"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createMilestoneAction } from "@/app/workspace/actions";

function getErrorMessage(value: unknown): string | null {
  if (value && typeof value === "object" && "error" in value) {
    const err = (value as { error: unknown }).error;
    return err != null && err !== "" ? String(err) : null;
  }
  return null;
}

interface CreateMilestoneDialogProps {
  workspaceId: string;
  orderIndex: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateMilestoneDialog({
  workspaceId,
  orderIndex,
  onSuccess,
  onCancel,
}: CreateMilestoneDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("workspace_id", workspaceId);
    formData.set("order_index", String(orderIndex));

    const result = await createMilestoneAction(formData);
    setLoading(false);
    const err = getErrorMessage(result);
    if (err !== null) {
      setError(err);
      return;
    }
    onSuccess();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Add milestone</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input name="title" required placeholder="Milestone title" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                name="description"
                rows={2}
                placeholder="Deliverables"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Amount *</label>
              <Input name="amount" type="number" min={1} required placeholder="5000" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Due date</label>
              <Input name="due_date" type="date" className="mt-1" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Adding…" : "Add milestone"}
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
