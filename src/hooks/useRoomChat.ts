import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export function useRoomChat(id: string | undefined, user: User | null, setActivities: React.Dispatch<React.SetStateAction<string[]>>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [messages, setMessages] = useState<any[]>([]);

  const fetchMessages = useCallback(async () => {
    if (!id) return;
    const { data, error } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('study_room_messages' as any)
      .select('*, profiles(name, avatar_url)')
      .eq('room_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Database fetch error:", error.message, error.details);
    } else if (data) {
      setMessages(data);
    }
  }, [id]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleSendMessage = useCallback(async (newMessage: string) => {
    if (!newMessage.trim() || !user || !id) return;

    setActivities((prev) => [
      `You sent a message`,
      ...prev,
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from('study_room_messages' as any).insert([
      { room_id: id, profile_id: user.id, content: newMessage }
    ]);
    
    if (error) {
      console.error("Database insert error:", error);
      toast.error("Failed to send message. Please try again.");
    }
  }, [id, user, setActivities]);

  return { messages, handleSendMessage, fetchMessages };
}
