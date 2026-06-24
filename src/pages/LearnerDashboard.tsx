import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/useAuth";
import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/config/api";
import { Link } from "react-router-dom";
import { Bot, Sparkles } from "lucide-react";
import RecommendedPartners from "@/components/recommendations/RecommendedPartners";
import { MentorshipMilestones } from "@/components/mentorship/MentorshipMilestones";

// Dashboard Widgets
import StreakXPWidget from "@/components/dashboard/StreakXPWidget";
import BadgesGridWidget from "@/components/dashboard/BadgesGridWidget";
import CommunitiesWidget from "@/components/dashboard/CommunitiesWidget";
import UpcomingSessionsWidget from "@/components/dashboard/UpcomingSessionsWidget";
import SolvedDoubtsWidget from "@/components/dashboard/SolvedDoubtsWidget";
import LearningProgress from "@/components/dashboard/LearningProgress";
import RecentActivity from "@/components/dashboard/RecentActivity";

const LearnerDashboard = () => {
  const { user } = useAuth();
  const { currentMode } = useRole();
  const { data: partners = [], isLoading: loadingPartners } = useQuery({
    queryKey: ["recommended-partners"],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/match/recommendations`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to fetch partners");
      const data = await response.json();
      return data.recommendations || [];
    },
  });

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
            <p className="text-slate-400">Here's your learning progress today.</p>
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
                <RecommendedPartners partners={partners} />
              )}
            </section>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default LearnerDashboard;
