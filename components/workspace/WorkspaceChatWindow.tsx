"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { WorkspaceMessage } from "@/lib/types";
import type { ParticipantSummary } from "@/lib/types";
import { formatDateTime } from "@/lib/formatDate";

interface WorkspaceChatWindowProps {
  workspaceId: string;
  currentUserId: string;
  initialMessages: WorkspaceMessage[];
  otherParticipant: ParticipantSummary;
}

export function WorkspaceChatWindow({
  workspaceId,
  currentUserId,
  initialMessages,
  otherParticipant,
}: WorkspaceChatWindowProps) {
  const [messages, setMessages] = useState<WorkspaceMessage[]>(initialMessages);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel(`workspace_messages:${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "workspace_messages",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          const newRow = payload.new as {
            id: string;
            workspace_id: string;
            sender_id: string;
            body: string;
            created_at: string;
            read_at: string | null;
          };
          setMessages((prev) => [
            ...prev,
            {
              id: newRow.id,
              workspace_id: newRow.workspace_id,
              sender_id: newRow.sender_id,
              body: newRow.body,
              created_at: newRow.created_at,
              read_at: newRow.read_at,
            },
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-muted/20">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No messages yet. Send the first workspace message.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {messages.map((msg) => {
              const isOwn = msg.sender_id === currentUserId;
              return (
                <li
                  key={msg.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      isOwn
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border border-border text-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm">
                      {msg.body}
                    </p>
                    <p
                      className={`mt-1 text-xs ${
                        isOwn ? "text-primary-foreground/80" : "text-muted-foreground"
                      }`}
                    >
                      {formatDateTime(msg.created_at)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
