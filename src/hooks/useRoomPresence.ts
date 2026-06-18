import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export function useRoomPresence(id: string | undefined, user: User | null, fetchMessages: () => void, setActivities: React.Dispatch<React.SetStateAction<string[]>>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [participants, setParticipants] = useState<any[]>([]);

  useEffect(() => {
    if (!id || !user) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let roomChannel: any;

    const initializeChat = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await supabase.from('profiles' as any).select('name').eq('id', user.id).single() as any;
      const displayName = data?.name || user.email?.split('@')[0] || 'Student';

      roomChannel = supabase.channel(`room_${id}`, {
        config: { presence: { key: user.id } },
      });

      roomChannel
        .on('presence', { event: 'sync' }, () => {
          const newState = roomChannel.presenceState();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const onlineUsers = Object.values(newState).map((p: any) => p[0]);

          setParticipants(onlineUsers);

          setActivities((prev) => [
            `${onlineUsers.length} participant(s) online`,
            ...prev,
          ]);
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'study_room_messages',
          filter: `room_id=eq.${id}`
        }, () => {
          fetchMessages(); 
        })
        .subscribe(async (status: string) => {
         if (status === 'SUBSCRIBED') {
            await roomChannel.track({
              user_id: user.id,
              name: displayName
            });

            setActivities((prev) => [
              `${displayName} joined the room`,
              ...prev,
            ]);
          }
        });
    };

    initializeChat();

    return () => {
      setActivities((prev) => [
        `${user?.email?.split("@")[0] || "User"} left the room`,
        ...prev,
      ]);

      if (roomChannel) supabase.removeChannel(roomChannel);
    };
  }, [id, user, fetchMessages]);

  return { participants };
}
