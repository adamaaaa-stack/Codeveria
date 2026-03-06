import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getUserConversations } from "@/lib/messaging";
import { ConversationList } from "@/components/messaging/ConversationList";

export default async function MessagesPage() {
  const user = await requireUser();
  const conversations = await getUserConversations(user.id);

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4 md:flex-row">
      <div className="flex flex-col border-border md:w-80 md:shrink-0 md:border-r">
        <div className="border-b border-border px-4 py-3">
          <h1 className="text-lg font-semibold">Messages</h1>
          <p className="text-sm text-muted-foreground">
            Your conversations with developers and companies.
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ConversationList conversations={conversations} />
        </div>
      </div>
      {conversations.length > 0 && (
        <div className="hidden flex-1 flex-col items-center justify-center border border-border bg-muted/10 md:flex">
          <p className="text-sm text-muted-foreground">
            Select a conversation or message a developer from their profile.
          </p>
        </div>
      )}
    </div>
  );
}
