"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Briefcase } from "lucide-react";
import type { Workspace } from "@/lib/types";
import { CreateWorkspaceDialog } from "./CreateWorkspaceDialog";

interface WorkspaceCTAProps {
  conversationId: string;
  studentId: string;
  workspace: Workspace | null;
  currentUserRole: "company" | "student";
}

export function WorkspaceCTA({
  conversationId,
  studentId,
  workspace,
  currentUserRole,
}: WorkspaceCTAProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  if (workspace) {
    return (
      <Button size="sm" variant="outline" className="gap-2" asChild>
        <Link href={`/workspace/${workspace.id}`}>
          <Briefcase className="h-4 w-4" />
          Open workspace
        </Link>
      </Button>
    );
  }

  if (currentUserRole === "company") {
    return (
      <>
        <Button size="sm" className="gap-2" onClick={() => setShowCreateDialog(true)}>
          <Briefcase className="h-4 w-4" />
          Create workspace
        </Button>
        {showCreateDialog && (
          <CreateWorkspaceDialog
            conversationId={conversationId}
            studentId={studentId}
            onCancel={() => setShowCreateDialog(false)}
          />
        )}
      </>
    );
  }

  return null;
}
