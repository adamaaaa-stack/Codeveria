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
  workspaces: Workspace[];
  currentUserRole: "company" | "student";
}

export function WorkspaceCTA({
  conversationId,
  studentId,
  workspaces,
  currentUserRole,
}: WorkspaceCTAProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const latestWorkspace = workspaces.length > 0 ? workspaces[0] : null;

  if (currentUserRole !== "company" && !latestWorkspace) return null;

  return (
    <div className="flex items-center gap-2">
      {latestWorkspace && (
        <Button size="sm" variant="outline" className="gap-2" asChild>
          <Link href={`/workspace/${latestWorkspace.id}`}>
            <Briefcase className="h-4 w-4" />
            Open workspace
          </Link>
        </Button>
      )}
      {currentUserRole === "company" && (
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
      )}
    </div>
  );
}
