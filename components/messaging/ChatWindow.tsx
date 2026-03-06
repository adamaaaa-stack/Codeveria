"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/types";
import type { ParticipantSummary } from "@/lib/types";
import { formatDateTime } from "@/lib/formatDate";

interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
  initialMessages: Message[];
  otherParticipant: ParticipantSummary;
}

export function ChatWindow({
  conversationId,
  currentUserId,
  initialMessages,
  otherParticipant,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newRow = payload.new as {
            id: string;
            conversation_id: string;
            sender_id: string;
            body: string;
            created_at: string;
            read_at: string | null;
          };
          setMessages((prev) => [
            ...prev,
            {
              id: newRow.id,
              conversation_id: newRow.conversation_id,
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
  }, [conversationId]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-muted/20">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No messages yet. Send the first message.
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
