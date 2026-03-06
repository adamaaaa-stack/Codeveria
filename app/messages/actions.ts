"use server";

import { getOrCreateConversation } from "@/lib/messaging";

export async function getOrCreateConversationAction(studentId: string) {
  const result = await getOrCreateConversation(studentId);
  if ("error" in result) return result;
  return { conversationId: result.conversationId, created: result.created };
}
