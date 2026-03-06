"use client";

import { useState, useRef } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface WorkspaceMessageComposerProps {
  workspaceId: string;
  currentUserId: string;
}

export function WorkspaceMessageComposer({
  workspaceId,
  currentUserId,
}: WorkspaceMessageComposerProps) {
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || loading) return;

    setError(null);
    setLoading(true);
    const supabase = createBrowserSupabaseClient();
    const { error: insertError } = await supabase.from("workspace_messages").insert({
      workspace_id: workspaceId,
      sender_id: currentUserId,
      body: trimmed,
    });
    setLoading(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setBody("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 border-t border-border bg-background p-4"
    >
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
          rows={2}
          className="min-h-[44px] max-h-[160px] flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={loading}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!body.trim() || loading}
          className="h-11 w-11 shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
