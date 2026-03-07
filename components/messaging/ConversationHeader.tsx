"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { WorkspaceCTA } from "@/components/workspace/WorkspaceCTA";
import type { ParticipantSummary } from "@/lib/types";
import type { Workspace } from "@/lib/types";
import { ArrowLeft } from "lucide-react";

interface ConversationHeaderProps {
  otherParticipant: ParticipantSummary;
  conversationId: string;
  studentId: string;
  workspaces: Workspace[];
  currentUserRole: "company" | "student";
}

export function ConversationHeader({
  otherParticipant,
  conversationId,
  studentId,
  workspaces,
  currentUserRole,
}: ConversationHeaderProps) {
  const name = otherParticipant.display_name ?? "Unknown";
  const initials = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <header className="flex shrink-0 items-center gap-4 border-b border-border bg-background px-4 py-3">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/messages" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </Button>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
          {otherParticipant.avatar_url ? (
            <img
              src={otherParticipant.avatar_url}
              alt=""
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{name}</p>
          <p className="text-xs capitalize text-muted-foreground">
            {otherParticipant.role}
          </p>
        </div>
      </div>
      <div className="shrink-0">
        <WorkspaceCTA
          conversationId={conversationId}
          studentId={studentId}
          workspaces={workspaces}
          currentUserRole={currentUserRole}
        />
      </div>
    </header>
  );
}
