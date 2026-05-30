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
  id: string;
  peerId: string;
  peerName: string;
  peerAvatar: string;
  subject: string;
  date: string;
  time: string;
  duration: number;
  status: "upcoming" | "completed" | "cancelled";
  rating?: number;
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
