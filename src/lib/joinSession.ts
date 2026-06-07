import { supabase } from "@/integrations/supabase/client";

export async function joinSession(
  sessionId: string | number,
  userId?: string,
): Promise<{ error: Error | null; alreadyJoined: boolean }> {
  let alreadyJoined = false;
  const normalizedSessionId = String(sessionId);

  if (userId) {
    const { data: existingParticipant } = await (supabase as any)
      .from("session_participants")
      .select("id")
      .eq("session_id", normalizedSessionId)
      .eq("user_id", userId)
      .maybeSingle();

    alreadyJoined = Boolean(existingParticipant);
  }

  const { error } = await supabase.rpc("join_session", {
    p_session_id: normalizedSessionId,
  });

  return {
    error: error ? new Error(error.message) : null,
    alreadyJoined,
  };
}
