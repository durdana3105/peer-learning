import { useEffect, useState } from "react";
import { Users, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/useAuth";

type JoinedCommunity = {
  id: string;
  name: string;
  members: number;
  color: string;
};

const COLOR_PALETTE = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-cyan-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
];

type ParticipantRow = {
  room_id: string;
  study_rooms:
    | {
        id: string;
        topic: string | null;
      }
    | {
        id: string;
        topic: string | null;
      }[]
    | null;
};

const resolveRoom = (row: ParticipantRow) => {
  if (Array.isArray(row.study_rooms)) {
    return row.study_rooms[0] ?? null;
  }
  return row.study_rooms;
};

export default function CommunitiesWidget() {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<JoinedCommunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchCommunities = async () => {
      if (!user) {
        if (mounted) {
          setCommunities([]);
          setLoading(false);
          setError(null);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data: memberships, error: membershipError } = await supabase
          .from("study_room_participants")
          .select("room_id, study_rooms(id, topic)")
          .eq("profile_id", user.id)
          .limit(12);

        if (membershipError) throw membershipError;

        const rows = (memberships ?? []) as ParticipantRow[];
        const rooms = rows
          .map((row) => resolveRoom(row))
          .filter((room): room is { id: string; topic: string | null } => Boolean(room?.id));

        const roomIds = [...new Set(rooms.map((room) => room.id))];
        const memberCounts = new Map<string, number>();

        if (roomIds.length > 0) {
          const { data: participantRows, error: countError } = await supabase
            .from("study_room_participants")
            .select("room_id")
            .in("room_id", roomIds);

          if (countError) throw countError;

          for (const row of participantRows ?? []) {
            const roomId = row.room_id as string;
            memberCounts.set(roomId, (memberCounts.get(roomId) ?? 0) + 1);
          }
        }

        if (!mounted) return;

        setCommunities(
          rooms.map((room, index) => ({
            id: room.id,
            name: room.topic?.trim() || "Study Room",
            members: memberCounts.get(room.id) ?? 1,
            color: COLOR_PALETTE[index % COLOR_PALETTE.length],
          }))
        );
      } catch (err) {
        console.error("Failed to fetch joined communities:", err);
        if (mounted) {
          setCommunities([]);
          setError("Couldn't load your communities.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchCommunities();
    return () => {
      mounted = false;
    };
  }, [user]);

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Users size={20} className="text-blue-400" />
          Communities
        </h3>
        <span className="text-sm font-medium text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
          {loading ? "…" : `${communities.length} Joined`}
        </span>
      </div>

      <div className="space-y-3 flex-1">
        {loading && (
          <p className="text-sm text-slate-400 py-6 text-center">Loading communities…</p>
        )}

        {!loading && error && (
          <p className="text-sm text-rose-300 py-6 text-center">{error}</p>
        )}

        {!loading && !error && communities.length === 0 && (
          <div className="py-6 text-center space-y-3">
            <p className="text-sm text-slate-400">
              You haven&apos;t joined any study communities yet.
            </p>
            <Link
              to="/rooms"
              className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300"
            >
              Discover communities <ExternalLink size={14} />
            </Link>
          </div>
        )}

        {!loading &&
          !error &&
          communities.map((community) => (
            <Link
              key={community.id}
              to={`/rooms/${community.id}`}
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/50 border border-slate-700/30 hover:border-slate-600 transition-colors group cursor-pointer"
              aria-label={`Open ${community.name}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl ${community.color} flex items-center justify-center text-white font-bold text-lg shadow-inner`}
                >
                  {community.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                    {community.name}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {community.members.toLocaleString()} member
                    {community.members === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
            </Link>
          ))}
      </div>

      <Link
        to="/rooms"
        className="mt-4 flex items-center justify-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors py-2 rounded-xl hover:bg-cyan-400/10"
      >
        Explore More <ExternalLink size={14} />
      </Link>
    </div>
  );
}
