import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, Calendar, Clock, Users } from "lucide-react";

import { EditSessionDialog } from "@/components/sessions/EditSessionDialog";
import { SessionChat } from "@/components/sessions/SessionChat";
import VideoRoom from "@/components/VideoRoom";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/useAuth";
import { useSessionRoom, COMPLETED_STATUSES } from "@/hooks/useSessions";
import { useAwardXP } from "@/hooks/useAwardXP";
import { useToast } from "@/hooks/use-toast";
import { joinSession } from "@/lib/joinSession";
import { supabase } from "@/integrations/supabase/client";

type ParticipantRow = {
  user_id: string;
  profiles?: {
    name?: string | null;
  } | null;
};

export default function SessionDetail() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const { mutate: awardXP } = useAwardXP();

  const [session, setSession] = useState<any>(null);
  const [mentorName, setMentorName] = useState("Mentor");
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  const {
    messages,
    activities,
    userStatus,
    typingUser,
    participantCount,
    isVideoActive,
    sessionSummary,
    summaryLoading,
    studyTime,
    sendMessage,
    sendTypingEvent,
    handleLeaveVideo,
    handleJoinVideo,
  } = useSessionRoom(session, user);

  const loadSession = useCallback(async () => {
    if (!sessionId) return;

    setLoading(true);
    setNotFound(false);

    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle();

    if (error || !data) {
      setNotFound(true);
      setSession(null);
      setLoading(false);
      return;
    }

    setSession(data);

    if (data.mentor_id) {
      const { data: mentorProfile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", data.mentor_id)
        .maybeSingle();

      setMentorName(mentorProfile?.name || "Mentor");
    }

    const { data: participantRows } = await (supabase as any)
      .from("session_participants")
      .select("user_id")
      .eq("session_id", sessionId);

    const rows = participantRows || [];
    setHasJoined(Boolean(rows.some((row: ParticipantRow) => row.user_id === user?.id)));

    if (rows.length > 0) {
      const userIds = rows.map((row: ParticipantRow) => row.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", userIds);

      const profileMap = new Map(
        (profiles || []).map((profile) => [profile.id, profile]),
      );

      setParticipants(
        rows.map((row: ParticipantRow) => ({
          user_id: row.user_id,
          profiles: profileMap.get(row.user_id) || null,
        })),
      );
    } else {
      setParticipants([]);
    }

    setLoading(false);
  }, [sessionId, user?.id]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  const isOwner = Boolean(session && user?.id && session.mentor_id === user.id);
  const isFull =
    session?.seat_limit != null && session.participants >= session.seat_limit;
  const isNonJoinable = COMPLETED_STATUSES.has(session?.status?.toLowerCase() ?? "");

  const handleJoin = async () => {
    if (!session) return;

    try {
      const { error, alreadyJoined } = await joinSession(session.id, user?.id);

      if (error) {
        if (error.message.includes("Session is full")) {
          toast({
            title: "Session Full",
            description: "This session has reached its seat limit.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      toast({ title: "Success!", description: "You have joined the session." });

      if (!alreadyJoined) {
        awardXP({ activity: "session_join" });
      }

      setHasJoined(true);
      await loadSession();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to join session.",
        variant: "destructive",
      });
    }
  };

  const handleCancelSession = async () => {
    if (!session) return;

    const { error } = await supabase
      .from("sessions")
      .update({ status: "ended" })
      .eq("id", session.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Session cancelled",
      description: "This session is no longer open for learners.",
    });

    await loadSession();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        Loading session...
      </div>
    );
  }

  if (notFound || !session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#020617] text-white">
        <h1 className="text-2xl font-bold">Session not found</h1>
        <Link to="/sessions" className="text-cyan-400 hover:underline">
          Back to sessions
        </Link>
      </div>
    );
  }

  const scheduledLabel = session.scheduled_at
    ? format(new Date(session.scheduled_at), "PPP 'at' p")
    : "Schedule TBD";

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <div className="relative z-10 p-6">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/sessions"
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
          >
            <ArrowLeft size={18} />
            Back to sessions
          </Link>

          {isOwner && (
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="border-white/20 bg-transparent text-white hover:bg-white/10"
                onClick={() => setEditOpen(true)}
              >
                Edit Session
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Cancel Session</Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-[#0f172a] text-white border-white/10">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel this session?</AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-300">
                      Learners will no longer be able to join this session.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-transparent text-white border-white/20">
                      Keep Session
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-500"
                      onClick={() => void handleCancelSession()}
                    >
                      Cancel Session
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                {session.status === "live" && (
                  <span className="rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-sm text-red-400">
                    LIVE NOW
                  </span>
                )}
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm capitalize text-slate-300">
                  {session.status}
                </span>
              </div>

              <h1 className="mb-4 text-4xl font-bold">{session.title}</h1>

              <div className="mb-6 text-slate-300">
                <MarkdownRenderer content={session.description || ""} />
              </div>

              <div className="mb-6 grid gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Calendar size={16} />
                  {scheduledLabel}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Users size={16} />
                  {session.participants || 0}
                  {session.seat_limit ? ` / ${session.seat_limit}` : ""} enrolled
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Clock size={16} />
                  {session.duration_minutes || 60} minutes
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-slate-400">Mentor</p>
                <p className="font-semibold">{mentorName}</p>
              </div>

              {!isOwner && (
                <Button
                  onClick={() => void handleJoin()}
                  disabled={isFull || hasJoined || isNonJoinable}
                  className="bg-gradient-to-r from-cyan-400 to-purple-500 font-bold text-black hover:opacity-90"
                >
                  {hasJoined ? "Joined" : isFull ? "Session Full" : "Join Session"}
                </Button>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <h2 className="mb-4 text-2xl font-bold">Participants</h2>
              <p className="mb-4 text-sm text-slate-400">
                {session.participants || 0} learner
                {(session.participants || 0) === 1 ? "" : "s"} enrolled
                {participantCount > 0 ? ` · ${participantCount} online now` : ""}
              </p>

              {participants.length > 0 ? (
                <div className="space-y-3">
                  {participants.map((participant) => (
                    <div
                      key={participant.user_id}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                    >
                      {participant.profiles?.name || "Learner"}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400">No participant details available yet.</p>
              )}
            </div>

            {isVideoActive ? (
              <VideoRoom
                roomName={String(session.id)}
                userName={user?.user_metadata?.full_name || "Anonymous Learner"}
                onLeave={handleLeaveVideo}
              />
            ) : null}
          </div>

          <div>
            <SessionChat
              selectedSession={session}
              messages={messages}
              activities={activities}
              userStatus={userStatus}
              typingUser={typingUser}
              participantCount={participantCount}
              isVideoActive={isVideoActive}
              sessionSummary={sessionSummary}
              summaryLoading={summaryLoading}
              studyTime={studyTime}
              sendMessage={sendMessage}
              sendTypingEvent={sendTypingEvent}
              handleLeaveVideo={handleLeaveVideo}
              handleJoinVideo={handleJoinVideo}
              user={user}
            />
          </div>
        </div>
      </div>

      <EditSessionDialog
        session={session}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSessionUpdated={() => {
          void loadSession();
        }}
      />
    </div>
  );
}
