import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/useAuth";

const LearnerDashboard = () => {
  const { user } = useAuth();
  const { currentMode } = useRole();

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
      </div>
    </div>
  );
};

export default LearnerDashboard;
