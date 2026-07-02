import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export function useRoomDetails(id: string | undefined, user: User | null) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [room, setRoom] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;

    const fetchRoomDetails = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await supabase.from('study_rooms' as any).select('*').eq('id', id).single();
      if (error) {
        console.error("Error fetching room:", error);
        if (error.code === 'PGRST116') {
          toast.error("Room not found or you don't have access.");
          navigate('/rooms');
        }
        return;
      }
      if (!data) return;

      setRoom(data);

      if (user) {
        const { error: joinError } = await supabase.rpc('join_public_study_room', {
          p_room_id: id as string,
        });

        if (joinError) {
          console.error("Access denied:", joinError.message);
          alert(joinError.message || "You don't have access to this room.");
          navigate('/rooms');
        }
      }
    };

    fetchRoomDetails();
  }, [id, user, navigate]);

  return { room };
}
