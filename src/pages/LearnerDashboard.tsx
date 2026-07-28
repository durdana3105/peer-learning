import { useCallback, useEffect, useState } from "react";
import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/useAuth";
import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/config/api";
import { Link } from "react-router-dom";
import { Bot, Sparkles } from "lucide-react";
import RecommendedPartners from "@/components/recommendations/RecommendedPartners";
import { MentorshipMilestones } from "@/components/mentorship/MentorshipMilestones";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Dashboard Widgets
import StreakXPWidget from "@/components/dashboard/StreakXPWidget";
import BadgesGridWidget from "@/components/dashboard/BadgesGridWidget";
import CommunitiesWidget from "@/components/dashboard/CommunitiesWidget";
import UpcomingSessionsWidget from "@/components/dashboard/UpcomingSessionsWidget";
import SolvedDoubtsWidget from "@/components/dashboard/SolvedDoubtsWidget";
import LearningProgress from "@/components/dashboard/LearningProgress";
import RecentActivity from "@/components/dashboard/RecentActivity";

type ConnectionStatus = "pending" | "accepted" | "rejected";

const LearnerDashboard = () => {
  const { user } = useAuth();
  const { currentMode } = useRole();
  const [connectionStatuses, setConnectionStatuses] = useState<
    Record<string, ConnectionStatus>
  >({});

  const { data: partners = [], isLoading: loadingPartners } = useQuery({
    queryKey: ["recommended-partners"],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/match/recommendations`,
        {
          credentials: "include",
        },
      );
      if (!response.ok) throw new Error("Failed to fetch partners");
      const data = await response.json();
      return data.recommendations || [];
    },
  });

  useEffect(() => {
    if (!user?.id) {
      setConnectionStatuses({});
      return;
    }

    setConnectionStatuses({});

    let isMounted = true;

    const fetchConnections = async () => {
      const { data, error } = await (supabase as any)
        .from("peer_connections")
        .select("sender_id, receiver_id, status")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      if (!isMounted) return;

      if (error) {
        console.error("Failed to fetch peer connections:", error);
        toast.error("Could not load your connection states.");
        return;
      }

      const nextStatuses = (data || []).reduce(
        (
          statuses: Record<string, ConnectionStatus>,
          connection: {
            sender_id: string;
            receiver_id: string;
            status: ConnectionStatus;
          },
        ) => {
          const peerId =
            connection.sender_id === user.id
              ? connection.receiver_id
              : connection.sender_id;
          statuses[peerId] = connection.status;
          return statuses;
        },
        {},
      );

      setConnectionStatuses(nextStatuses);
    };

    fetchConnections();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const handleConnectPartner = useCallback(
    async (partnerId: string) => {
      if (!user?.id) {
        toast.error("Please sign in to connect with learning partners.");
        return;
      }

      if (partnerId === user.id) {
        toast.error("You cannot connect with yourself.");
        return;
      }

      if (connectionStatuses[partnerId]) {
        toast.info(
          connectionStatuses[partnerId] === "accepted"
            ? "You are already connected with this learner."
            : "A connection request already exists.",
        );
        return;
      }

      const { data: existingConnections, error: lookupError } = await (
        supabase as any
      )
        .from("peer_connections")
        .select("sender_id, receiver_id, status")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`,
        )
        .limit(1);

      if (lookupError) {
        console.error("Failed to check peer connection:", lookupError);
        toast.error("Could not check this connection. Please try again.");
        return;
      }

      const existingConnection = existingConnections?.[0];
      if (existingConnection) {
        setConnectionStatuses((prev) => ({
          ...prev,
          [partnerId]: existingConnection.status,
        }));
        toast.info(
          existingConnection.status === "accepted"
            ? "You are already connected with this learner."
            : "A connection request already exists.",
        );
        return;
      }

      const { error: insertError } = await (supabase as any)
        .from("peer_connections")
        .insert({
          sender_id: user.id,
          receiver_id: partnerId,
          status: "pending",
        });

      if (insertError) {
        if (insertError.code === "23505") {
          const { data: duplicateConnections, error: duplicateLookupError } =
            await (supabase as any)
              .from("peer_connections")
              .select("status")
              .or(
                `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`,
              )
              .limit(1);

          if (duplicateLookupError) {
            console.error(
              "Failed to fetch duplicate peer connection:",
              duplicateLookupError,
            );
          } else {
            const duplicateConnection = duplicateConnections?.[0];
            if (duplicateConnection?.status) {
              setConnectionStatuses((prev) => ({
                ...prev,
                [partnerId]: duplicateConnection.status,
              }));
            }
          }

          toast.info("A connection request already exists.");
          return;
        }

        console.error("Failed to send peer connection request:", insertError);
        toast.error("Failed to send connection request. Please try again.");
        return;
      }

      setConnectionStatuses((prev) => ({
        ...prev,
        [partnerId]: "pending",
      }));
      toast.success("Connection request sent.");
    },
    [connectionStatuses, user?.id],
  );

  const displayName =
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email ||
    "Learner";

  return (
    <div className="min-h-screen bg-[#020617] px-4 py-8 text-slate-100 overflow-hidden relative">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="mx-auto max-w-7xl space-y-8 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-medium mb-2">
              <Sparkles size={14} /> Mode: {currentMode}
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Welcome back, {displayName}
            </h1>
            <p className="text-slate-400">
              Here's your learning progress today.
            </p>
          </div>

          <Link
            to="/mock-interview"
            className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(8,145,178,0.3)] hover:shadow-[0_0_30px_rgba(8,145,178,0.5)] whitespace-nowrap"
          >
            <Bot className="group-hover:rotate-12 transition-transform" />
            Practice AI Interview
          </Link>
        </div>

        {/* Top Grid: Main Stats (Streak/XP, Badges, Doubts) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="col-span-1 md:col-span-4 lg:col-span-4">
            <StreakXPWidget />
          </div>
          <div className="col-span-1 md:col-span-8 lg:col-span-5">
            <BadgesGridWidget />
          </div>
          <div className="col-span-1 md:col-span-12 lg:col-span-3">
            <SolvedDoubtsWidget />
          </div>
        </div>

        {/* Middle Grid: Progress, Sessions, Communities */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <LearningProgress />
          </div>
          <div className="lg:col-span-1">
            <UpcomingSessionsWidget />
          </div>
          <div className="lg:col-span-1">
            <CommunitiesWidget />
          </div>
        </div>

        {/* Bottom Section: Activity and Mentorship */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <RecentActivity />
          </div>
          <div className="lg:col-span-8 space-y-6">
            {user && (
              <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6">
                <MentorshipMilestones userId={user.id} isMentor={false} />
              </section>
            )}

            <section>
              {loadingPartners ? (
                <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-8 flex items-center justify-center min-h-[200px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
                </div>
              ) : (
                <RecommendedPartners
                  partners={partners}
                  connectionStatuses={connectionStatuses}
                  onConnect={handleConnectPartner}
                />
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnerDashboard;
