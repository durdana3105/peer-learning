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

export const currentUser: User = {
  id: "me",
  name: "Alex Chen",
  avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Alex",
  bio: "CS student passionate about teaching math and learning design.",
  skills: ["JavaScript", "Python", "Math", "Data Structures"],
  interests: ["UI/UX Design", "Machine Learning", "Photography"],
  teachSubjects: ["JavaScript", "Python", "Calculus", "Linear Algebra"],
  learnSubjects: ["UI/UX Design", "Figma", "Machine Learning"],
  rating: 4.8,
  sessionsCompleted: 24,
  points: 1250,
  badges: ["🔥 Streak Master", "⭐ Top Tutor", "📚 Bookworm"],
};

export const peers: User[] = [
  {
    id: "1",
    name: "Sarah Kim",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah",
    bio: "Design student who loves teaching Figma and learning to code.",
    skills: ["UI/UX Design", "Figma", "Illustration", "Typography"],
    interests: ["JavaScript", "React", "Data Visualization"],
    teachSubjects: ["UI/UX Design", "Figma", "Color Theory"],
    learnSubjects: ["JavaScript", "React", "Python"],
    rating: 4.9,
    sessionsCompleted: 31,
    points: 1580,
    badges: ["🎨 Creative Genius", "⭐ Top Tutor"],
    matchScore: 95,
  },
  {
    id: "2",
    name: "Marcus Johnson",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Marcus",
    bio: "ML enthusiast, happy to trade knowledge on algorithms for language skills.",
    skills: ["Machine Learning", "Python", "TensorFlow", "Statistics"],
    interests: ["Spanish", "Public Speaking", "Philosophy"],
    teachSubjects: ["Machine Learning", "Python", "Statistics"],
    learnSubjects: ["Spanish", "Public Speaking"],
    rating: 4.7,
    sessionsCompleted: 18,
    points: 920,
    badges: ["🧠 Brain Power"],
    matchScore: 88,
  },
  {
    id: "3",
    name: "Priya Patel",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Priya",
    bio: "Math whiz and aspiring photographer. Let's swap skills!",
    skills: ["Calculus", "Linear Algebra", "Physics"],
    interests: ["Photography", "Photoshop", "Video Editing"],
    teachSubjects: ["Calculus", "Physics", "Linear Algebra"],
    learnSubjects: ["Photography", "Photoshop"],
    rating: 4.6,
    sessionsCompleted: 12,
    points: 680,
    badges: ["📐 Math Wizard"],
    matchScore: 72,
  },
  {
    id: "4",
    name: "Jamal Williams",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Jamal",
    bio: "Full-stack dev who wants to learn music production.",
    skills: ["React", "Node.js", "TypeScript", "PostgreSQL"],
    interests: ["Music Production", "Piano", "Audio Engineering"],
    teachSubjects: ["React", "Node.js", "TypeScript"],
    learnSubjects: ["Music Production", "Piano"],
    rating: 4.8,
    sessionsCompleted: 22,
    points: 1100,
    badges: ["💻 Code Ninja", "🔥 Streak Master"],
    matchScore: 65,
  },
  {
    id: "5",
    name: "Luna Martinez",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Luna",
    bio: "Language lover and data science student.",
    skills: ["Spanish", "French", "Data Science", "R"],
    interests: ["Japanese", "Machine Learning", "Creative Writing"],
    teachSubjects: ["Spanish", "French", "R Programming"],
    learnSubjects: ["Japanese", "Machine Learning"],
    rating: 4.9,
    sessionsCompleted: 28,
    points: 1400,
    badges: ["🌎 Polyglot", "⭐ Top Tutor", "🔥 Streak Master"],
    matchScore: 60,
  },
  {
    id: "6",
    name: "Wei Zhang",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Wei",
    bio: "Physics PhD student who enjoys teaching and wants to learn web dev.",
    skills: ["Physics", "Math", "MATLAB", "LaTeX"],
    interests: ["Web Development", "JavaScript", "React"],
    teachSubjects: ["Physics", "Advanced Math", "MATLAB"],
    learnSubjects: ["JavaScript", "React", "CSS"],
    rating: 4.5,
    sessionsCompleted: 15,
    points: 780,
    badges: ["🔬 Science Star"],
    matchScore: 58,
  },
];

export const sessions: Session[] = [
  {
    id: "s1",
    peerId: "1",
    peerName: "Sarah Kim",
    peerAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah",
    subject: "UI/UX Design Basics",
    date: "2026-04-05",
    time: "10:00 AM",
    duration: 60,
    status: "upcoming",
  },
  {
    id: "s2",
    peerId: "2",
    peerName: "Marcus Johnson",
    peerAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Marcus",
    subject: "Intro to Machine Learning",
    date: "2026-04-07",
    time: "2:00 PM",
    duration: 45,
    status: "upcoming",
  },
  {
    id: "s3",
    peerId: "4",
    peerName: "Jamal Williams",
    peerAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Jamal",
    subject: "React Hooks Deep Dive",
    date: "2026-03-28",
    time: "3:00 PM",
    duration: 60,
    status: "completed",
    rating: 5,
  },
];

export const messages: Message[] = [
  {
    id: "m1",
    peerId: "1",
    peerName: "Sarah Kim",
    peerAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah",
    lastMessage: "See you tomorrow for our design session! 🎨",
    timestamp: "2 min ago",
    unread: 1,
  },
  {
    id: "m2",
    peerId: "2",
    peerName: "Marcus Johnson",
    peerAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Marcus",
    lastMessage: "I shared some ML resources with you",
    timestamp: "1 hour ago",
    unread: 0,
  },
  {
    id: "m3",
    peerId: "4",
    peerName: "Jamal Williams",
    peerAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Jamal",
    lastMessage: "Great session today! Thanks for the React tips",
    timestamp: "Yesterday",
    unread: 0,
  },
];

export const leaderboard = [
  { rank: 1, name: "Luna Martinez", points: 1400, avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Luna" },
  { rank: 2, name: "Sarah Kim", points: 1580, avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah" },
  { rank: 3, name: "Alex Chen", points: 1250, avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Alex" },
  { rank: 4, name: "Jamal Williams", points: 1100, avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Jamal" },
  { rank: 5, name: "Marcus Johnson", points: 920, avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Marcus" },
];
