export interface User {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  skills: string[];
  interests: string[];
  teachSubjects: string[];
  learnSubjects: string[];
  rating: number;
  sessionsCompleted: number;
  points: number;
  badges: string[];
  matchScore?: number;
}

export interface Session {
  id: number;
  title: string | null;
  description: string | null;
  scheduled_at: string | null;
  duration_minutes: number;
  status: string;
  mentor_id: string | null;
  student_id: string | null;
  seat_limit: number | null;
  participants: number;
  tags: string[] | null;
  created_at: string;
}

export interface Message {
  id: string;
  peerId: string;
  peerName: string;
  peerAvatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
}
