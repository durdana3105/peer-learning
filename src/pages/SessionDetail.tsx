import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/useAuth";

const SessionDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    const { data } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", id)
      .single();

    setSession(data);
  };

  const joinSession = async () => {
    const { error } = await supabase.from("session_participants").insert({
      session_id: id,
      user_id: user?.id,
    });

    if (error) {
      alert("Already joined");
      return;
    }

    alert("Joined 🚀");
  };

  if (!session) return <p>Loading...</p>;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-4xl font-bold">{session.title}</h1>

      <p className="mt-4">{session.description}</p>

      <div className="mt-6">
        Seats:
        {session.participants}/{session.seats}
      </div>

      <button
        onClick={joinSession}
        className="mt-6 bg-cyan-500 px-6 py-3 rounded"
      >
        Join Session
      </button>
    </div>
  );
};

export default SessionDetail;
