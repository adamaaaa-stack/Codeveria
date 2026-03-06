"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ConversationWithParticipant } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/formatDate";

interface ConversationListProps {
  conversations: ConversationWithParticipant[];
}

export function ConversationList({ conversations }: ConversationListProps) {
  const pathname = usePathname();

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          No conversations yet
        </p>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Message a developer from their profile to start a conversation.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {conversations.map((conv) => {
        const isActive = pathname === `/messages/${conv.id}`;
        const name = conv.otherParticipant.display_name ?? "Unknown";
        const initials = name.trim().charAt(0).toUpperCase() || "?";

        return (
          <li key={conv.id}>
            <Link
              href={`/messages/${conv.id}`}
              className={cn(
                "flex items-start gap-3 p-4 transition-colors hover:bg-muted/50",
                isActive && "bg-muted/50"
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                {conv.otherParticipant.avatar_url ? (
                  <img
                    src={conv.otherParticipant.avatar_url}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{name}</span>
                  {conv.unreadCount > 0 && (
                    <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                  {conv.otherParticipant.role}
                </p>
                {conv.lastMessage && (
                  <>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {conv.lastMessage.body}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDateTime(conv.lastMessage.created_at)}
                    </p>
                  </>
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
