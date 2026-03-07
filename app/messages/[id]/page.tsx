import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  getConversationById,
  getConversationMessages,
  markConversationRead,
} from "@/lib/messaging";
import { getWorkspacesForConversation } from "@/lib/workspaces";
import { ChatWindow } from "@/components/messaging/ChatWindow";
import { MessageComposer } from "@/components/messaging/MessageComposer";
import { ConversationHeader } from "@/components/messaging/ConversationHeader";

export default async function ConversationPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireUser();
  const conversationId = params.id;

  const [conversation, messages, workspaces] = await Promise.all([
    getConversationById(conversationId, user.id),
    getConversationMessages(conversationId, user.id),
    getWorkspacesForConversation(conversationId, user.id),
  ]);

  if (!conversation) {
    redirect("/messages");
  }

  await markConversationRead(conversationId, user.id);

  const currentUserRole =
    (conversation as { company_id: string; student_id: string }).company_id === user.id
      ? "company"
      : "student";
  const studentId = (conversation as { company_id: string; student_id: string }).student_id;

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-0">
      <ConversationHeader
        otherParticipant={conversation.otherParticipant}
        conversationId={conversationId}
        studentId={studentId}
        workspaces={workspaces}
        currentUserRole={currentUserRole}
      />

      <div className="flex min-h-0 flex-1 flex-col">
        <ChatWindow
          conversationId={conversationId}
          currentUserId={user.id}
          initialMessages={messages}
          otherParticipant={conversation.otherParticipant}
        />
        <MessageComposer
          conversationId={conversationId}
          currentUserId={user.id}
        />
      </div>
    </div>
  );
}
