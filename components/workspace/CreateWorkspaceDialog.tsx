"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createWorkspaceAction } from "@/app/workspace/actions";

interface CreateWorkspaceDialogProps {
  conversationId: string;
  studentId: string;
  onCancel: () => void;
}

export function CreateWorkspaceDialog({
  conversationId,
  studentId,
  onCancel,
}: CreateWorkspaceDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("conversation_id", conversationId);
    formData.set("student_id", studentId);

    const result = await createWorkspaceAction(formData);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if ("workspaceId" in result) {
      router.push(`/workspace/${result.workspaceId}`);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Create workspace</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input name="title" required placeholder="Project title" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Description *</label>
              <textarea
                name="description"
                required
                rows={3}
                placeholder="Project scope and deliverables"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tech stack (comma separated)</label>
              <Input name="tech_stack" placeholder="React, TypeScript, Node" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Total budget (e.g. cents or whole units) *</label>
              <Input
                name="total_budget"
                type="number"
                min={1}
                required
                placeholder="10000"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Start date</label>
                <Input name="start_date" type="date" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">End date</label>
                <Input name="end_date" type="date" className="mt-1" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating…" : "Create workspace"}
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
