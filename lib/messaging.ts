import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  ConversationWithParticipant,
  Message,
  ParticipantSummary,
} from "@/lib/types";

export async function getUserConversations(
  userId: string
): Promise<ConversationWithParticipant[]> {
  const supabase = await createServerSupabaseClient();

  const { data: rows, error } = await supabase
    .from("conversations")
    .select("id, company_id, student_id, created_at")
    .or(`company_id.eq.${userId},student_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error || !rows?.length) return [];

  const otherIds = rows.map((r) =>
    r.company_id === userId ? r.student_id : r.company_id
  );
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, role, avatar_url")
    .in("id", otherIds);
  const profileMap = new Map(
    (profiles ?? []).map((p: { id: string; display_name: string | null; role: string; avatar_url: string | null }) => [
      p.id,
      {
        id: p.id,
        display_name: p.display_name,
        role: p.role,
        avatar_url: p.avatar_url,
      } as ParticipantSummary,
    ])
  );

  const convIds = rows.map((r) => r.id);
  const { data: lastMessages } = await supabase
    .from("messages")
    .select("conversation_id, body, created_at, sender_id")
    .in("conversation_id", convIds)
    .order("created_at", { ascending: false });

  const lastByConv = new Map<string, { body: string; created_at: string; sender_id: string }>();
  for (const m of lastMessages ?? []) {
    if (!lastByConv.has(m.conversation_id)) {
      lastByConv.set(m.conversation_id, {
        body: m.body,
        created_at: m.created_at,
        sender_id: m.sender_id,
      });
    }
  }

  const { data: unreadRows } = await supabase
    .from("messages")
    .select("conversation_id")
    .in("conversation_id", convIds)
    .is("read_at", null)
    .neq("sender_id", userId);

  const unreadByConv = new Map<string, number>();
  for (const r of unreadRows ?? []) {
    unreadByConv.set(
      r.conversation_id,
      (unreadByConv.get(r.conversation_id) ?? 0) + 1
    );
  }

  return rows.map((r) => {
    const otherId = r.company_id === userId ? r.student_id : r.company_id;
    return {
      id: r.id,
      created_at: r.created_at,
      otherParticipant: profileMap.get(otherId) ?? {
        id: otherId,
        display_name: null,
        role: "unknown",
        avatar_url: null,
      },
      lastMessage: lastByConv.get(r.id) ?? null,
      unreadCount: unreadByConv.get(r.id) ?? 0,
    };
  });
}

export async function getConversationById(
  conversationId: string,
  userId: string
): Promise<{
  id: string;
  company_id: string;
  student_id: string;
  created_at: string;
  otherParticipant: ParticipantSummary;
} | null> {
  const supabase = await createServerSupabaseClient();

  const { data: conv, error } = await supabase
    .from("conversations")
    .select("id, company_id, student_id, created_at")
    .eq("id", conversationId)
    .single();

  if (error || !conv) return null;
  if (conv.company_id !== userId && conv.student_id !== userId) return null;

  const otherId = conv.company_id === userId ? conv.student_id : conv.company_id;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, role, avatar_url")
    .eq("id", otherId)
    .single();

  const otherParticipant: ParticipantSummary = profile
    ? {
        id: profile.id,
        display_name: profile.display_name,
        role: profile.role,
        avatar_url: profile.avatar_url,
      }
    : { id: otherId, display_name: null, role: "unknown", avatar_url: null };

  return {
    ...conv,
    otherParticipant,
  };
}

export async function getConversationMessages(
  conversationId: string,
  userId: string
): Promise<Message[]> {
  const supabase = await createServerSupabaseClient();

  const { data: conv } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .or(`company_id.eq.${userId},student_id.eq.${userId}`)
    .single();

  if (!conv) return [];

  const { data: rows, error } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, body, created_at, read_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) return [];
  return (rows ?? []) as Message[];
}

export async function getOrCreateConversation(
  studentId: string
): Promise<{ conversationId: string; created: boolean } | { error: string }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const companyId = user.id;
  const { data: companyProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", companyId)
    .single();
  if (companyProfile?.role !== "company") {
    return { error: "Only companies can start conversations" };
  }

  const { data: studentProfile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", studentId)
    .single();
  if (!studentProfile || studentProfile.role !== "student") {
    return { error: "Invalid student" };
  }

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("company_id", companyId)
    .eq("student_id", studentId)
    .single();

  if (existing) {
    return { conversationId: existing.id, created: false };
  }

  const { data: inserted, error } = await supabase
    .from("conversations")
    .insert({ company_id: companyId, student_id: studentId })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { conversationId: inserted.id, created: true };
}

export async function markConversationRead(
  conversationId: string,
  currentUserId: string
): Promise<void> {
  const supabase = await createServerSupabaseClient();

  const { data: conv } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .or(`company_id.eq.${currentUserId},student_id.eq.${currentUserId}`)
    .single();

  if (!conv) return;

  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", currentUserId)
    .is("read_at", null);
}
