import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export const messagesService = {
  async getUsers(currentUserId: string) {
    const [profileResult, userResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .neq("id", currentUserId)
        .order("name", { ascending: true })
        .limit(100),
      supabase
        .from("profiles")
        .select("*")
        .neq("id", currentUserId)
        .order("name", { ascending: true })
        .limit(100),
    ]);
    
    // Note: This matches the original logic which queried profiles twice.
    // Ideally this would be optimized, but we keep behavior exactly the same for now.
    return { profileResult, userResult };
  },

  async getMessages(currentUserId: string) {
    return supabase
      .from("messages")
      .select("id,sender_id,receiver_id,content,text,message,created_at,read_at")
      .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
      .order("created_at", { ascending: false })
      .limit(100);
  },

  async markMessagesAsRead(messageIds: string[]) {
    // @ts-expect-error TODO: refine typing for rpc if needed
    return supabase.rpc("mark_messages_as_read", {
      message_ids: messageIds,
    });
  },

  async sendMessage(senderId: string, receiverId: string, content: string) {
    return supabase
      .from("messages")
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        content,
        text: content,
      })
      .select("id,sender_id,receiver_id,content,text,message,created_at,read_at")
      .single();
  },
};
