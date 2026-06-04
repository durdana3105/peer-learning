import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/useAuth";
import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/config/api";
import { Link } from "react-router-dom";
import { Bot } from "lucide-react";
import RecommendedPartners from "@/components/recommendations/RecommendedPartners";
import { MentorshipMilestones } from "@/components/mentorship/MentorshipMilestones";

const LearnerDashboard = () => {
  const { user } = useAuth();
  const { currentMode } = useRole();
  const { data: partners = [], isLoading: loadingPartners } = useQuery({
    queryKey: ["recommended-partners"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/api/match/recommendations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-2">
          <p className="text-sm text-blue-300">Current mode: {currentMode}</p>
          <h1 className="text-3xl font-bold">Learner Dashboard</h1>
          <p className="text-slate-400">{displayName}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Sessions Attended</p>
            <p className="mt-2 text-3xl font-semibold">0</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Skills Learning</p>
            <p className="mt-2 text-3xl font-semibold">0</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Points Earned</p>
            <p className="mt-2 text-3xl font-semibold">0</p>
          </div>
        </div>

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Your Mentors</h2>
          <p className="mt-3 text-slate-400">
            You have not connected with any mentors yet. Visit Discover to find
            one.
          </p>
        </section>

        {user && (
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <MentorshipMilestones userId={user.id} isMentor={false} />
          </section>
        )}

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Bot className="text-cyan-400" /> AI Mock Interviews
            </h2>
            <p className="mt-2 text-slate-400">
              Practice your behavioral and technical interview skills with our AI. Get real-time feedback and an evaluation report.
            </p>
          </div>
          <Link
            to="/mock-interview"
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap"
          >
            Start Practice
          </Link>
        </section>
                <section>
          {loadingPartners ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <p className="text-slate-400">
                Loading recommended learning partners...
              </p>
            </div>
          ) : (
            <RecommendedPartners partners={partners} />
          )}
        </section>
      </div>
    </div>
  );
};

export default LearnerDashboard;
