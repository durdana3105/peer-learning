import { supabase } from "@/integrations/supabase/client";

export const rewardXP = async (
  userId: string,
  amount: number
) => {
  // Delegate to the increment_user_xp RPC which performs a single atomic
  // UPDATE, eliminating the read-modify-write race where two concurrent
  // award events both read the same stale XP value and one write clobbers
  // the other (see issue #143). auth.uid() inside the RPC enforces that
  // users can only increment their own XP.
  await (supabase as unknown).rpc("increment_user_xp", { _amount: amount });
};


