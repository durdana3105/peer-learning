import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Sessions = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    const fetchSessions = async () => {
      const { data, error } = await (supabase as any)
        .from("sessions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.log(error);
      } else {
        setSessions(data);
      }
    };

    fetchSessions();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">All Sessions</h1>

      {sessions.length > 0 ? (
        sessions.map((s) => (
          <div key={s.id} className="border p-4 rounded mb-3">
            <h2 className="font-semibold">{s.title}</h2>
            <p>{s.description}</p>
            <p className="text-sm text-gray-500">
              Status: {s.status}
            </p>
          </div>
        ))
      ) : (
        <p>No sessions found</p>
      )}
    </div>
  );
};

export default Sessions;