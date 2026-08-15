import type { Session } from "@/types";

type LearnerProfile = {
  id: string;
  name: string | null;
  avatar_url: string | null;
};

export type MentorSessionRow = {
  id: number;
  title: string | null;
  scheduled_at: string | null;
  duration_minutes: number | null;
  status: string | null;
  student_id: string | null;
  student: LearnerProfile | LearnerProfile[] | null;
};

const resolveLearner = (session: MentorSessionRow): LearnerProfile | null => {
  if (Array.isArray(session.student)) {
    return session.student[0] ?? null;
  }
  return session.student ?? null;
};

export const toSessionCardModel = (session: MentorSessionRow): Session => {
  const scheduledAt = session.scheduled_at ? new Date(session.scheduled_at) : null;
  const learner = resolveLearner(session);

  return {
    id: String(session.id),
    peerId: learner?.id ?? session.student_id ?? "",
    peerName: learner?.name?.trim() || "Learner",
    peerAvatar: learner?.avatar_url || "/placeholder.svg",
    subject: session.title || "Mentorship session",
    date: scheduledAt ? scheduledAt.toLocaleDateString() : "Not scheduled",
    time: scheduledAt
      ? scheduledAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "",
    duration: session.duration_minutes ?? 60,
    status:
      session.status === "ended" || session.status === "completed"
        ? "completed"
        : "upcoming",
  };
};
