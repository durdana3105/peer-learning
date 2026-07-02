import React, { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface InviteMenuProps {
  roomId: string;
}

export const InviteMenu = React.memo(function InviteMenu({ roomId }: InviteMenuProps) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [showInviteUI, setShowInviteUI] = useState(false);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.rpc as any)("invite_to_study_room", {
      p_room_id: roomId,
      p_user_email: inviteEmail,
    });

    if (error) {
      console.error("Invite error:", error);
      toast.error(error.message || "Failed to invite user.");
    } else {
      toast.success(`Invited ${inviteEmail} successfully!`);
      setInviteEmail("");
      setShowInviteUI(false);
    }
    setIsInviting(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowInviteUI(!showInviteUI)}
        className="text-sm bg-blue-600/10 text-blue-400 font-medium hover:bg-blue-600/20 px-5 py-2.5 rounded-lg transition"
      >
        Invite
      </button>
      {showInviteUI && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-3 z-10 flex flex-col gap-2">
          <input
            type="email"
            placeholder="User email address"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleInvite}
            disabled={isInviting || !inviteEmail.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded disabled:opacity-50"
          >
            {isInviting ? "Inviting..." : "Send Invite"}
          </button>
        </div>
      )}
    </div>
  );
});
