"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { getOrCreateConversationAction } from "@/app/messages/actions";
import type { DbProfile } from "@/lib/auth";

interface StartConversationButtonProps {
  studentId: string;
  currentProfile: DbProfile | null;
}

export function StartConversationButton({
  studentId,
  currentProfile,
}: StartConversationButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!currentProfile) {
    return (
      <Button size="sm" className="gap-2" asChild>
        <Link href={`/login?redirect=/developers/${studentId}`}>
          <MessageCircle className="h-4 w-4" />
          Log in to message
        </Link>
      </Button>
    );
  }

  if (currentProfile.role === "student") {
    return null;
  }

  if (currentProfile.role !== "company") {
    return null;
  }

  async function handleClick() {
    setError(null);
    setLoading(true);
    const result = await getOrCreateConversationAction(studentId);
    setLoading(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.push(`/messages/${result.conversationId}`);
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        size="sm"
        className="gap-2"
        onClick={handleClick}
        disabled={loading}
      >
        <MessageCircle className="h-4 w-4" />
        {loading ? "Opening…" : "Message developer"}
      </Button>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
