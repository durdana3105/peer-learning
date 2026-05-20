import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/useAuth";

const MentorDashboard = () => {
  const { user } = useAuth();
  const { currentMode } = useRole();

  const displayName =
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email ||
    "Mentor";

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-2">
          <p className="text-sm text-emerald-300">
            Current mode: {currentMode}
          </p>
          <h1 className="text-3xl font-bold">Mentor Dashboard</h1>
          <p className="text-slate-400">{displayName}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Sessions Hosted</p>
            <p className="mt-2 text-3xl font-semibold">0</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Active Learners</p>
            <p className="mt-2 text-3xl font-semibold">0</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Average Rating</p>
            <p className="mt-2 text-3xl font-semibold">&nbsp;</p>
          </div>
        </div>

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Upcoming Sessions</h2>
          <p className="mt-3 text-slate-400">
            No upcoming sessions. Once learners book with you, they will appear
            here.
          </p>
        </section>
      </div>
    </div>
  );
};

export default MentorDashboard;
