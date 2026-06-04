import { ProfileSummary, MessageRow } from "@/hooks/useMessages";

export const getDisplayName = (profile?: Pick<ProfileSummary, "name" | "email"> | null) =>
  profile?.name?.trim() || profile?.email?.split("@")[0] || "Learner";

export const getInitial = (profile?: Pick<ProfileSummary, "name" | "email"> | null) =>
  getDisplayName(profile).charAt(0).toUpperCase();

export const getMessageBody = (message: MessageRow) =>
  message.content || message.text || message.message || "";

export const getRoleLabel = (profile: ProfileSummary) => {
  if (profile.is_mentor && profile.is_learner) return "Mentor + Learner";
  if (profile.is_mentor) return "Mentor";
  if (profile.is_learner) return "Learner";
  return "Peer";
};

export const formatTime = (value: string | null) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatRelativeTime = (value: string | null) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMinutes = Math.max(1, Math.floor((Date.now() - date.getTime()) / 60000));

  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};
