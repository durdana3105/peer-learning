import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export function useRoomPresence(id: string | undefined, user: User | null, fetchMessages: () => void, setActivities: React.Dispatch<React.SetStateAction<string[]>>) {
   
  const [participants, setParticipants] = useState<any[]>([]);

  useEffect(() => {
    if (!id || !user) return;

     
    let roomChannel: any;
    let cancelled = false;

    const initializeChat = async () => {
       
      const { data } = await supabase.from('profiles' as any).select('name').eq('id', user.id).single() as any;

      // The effect may have been cleaned up (user left/switched rooms) while
      // this request was in flight. Bail out before creating/subscribing to
      // a channel that would otherwise leak.
      if (cancelled) return;

      const displayName = data?.name || user.email?.split('@')[0] || 'Student';

      roomChannel = supabase.channel(`room_${id}`, {
        config: { presence: { key: user.id } },
      });

      roomChannel
        .on('presence', { event: 'sync' }, () => {
          const newState = roomChannel.presenceState();
           
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
            // Guard again: cleanup could have run between subscribe() being
            // called and this callback firing.
            if (cancelled) return;

            await roomChannel.track({
              user_id: user.id,
              name: displayName
            });

            if (cancelled) return;

            setActivities((prev) => [
              `${displayName} joined the room`,
              ...prev,
            ]);
          }
        });
    };

    initializeChat();

    return () => {
      cancelled = true;

      setActivities((prev) => [
        `${user?.email?.split("@")[0] || "User"} left the room`,
        ...prev,
      ]);

      if (roomChannel) supabase.removeChannel(roomChannel);
    };
  }, [id, user, fetchMessages, setActivities]);

  return { participants };
}