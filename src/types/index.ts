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
  trustScore?: number;
  totalReviews?: number;
  averageRating?: number;
  positiveTagsCount?: number;
  negativeTagsCount?: number;
  mentorBadge?: string | null;
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

export interface SessionReview {
  id: string;
  sessionId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  tags: string[];
  comment?: string | null;
  createdAt: string;
  reviewerName?: string;
  reviewerAvatar?: string;
}

export interface TrustMetrics {
  trustScore: number;
  averageRating: number;
  totalReviews: number;
  positiveTagsCount: number;
  negativeTagsCount: number;
  mentorBadge: string | null;
}

