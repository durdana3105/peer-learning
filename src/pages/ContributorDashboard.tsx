import { useEffect, useState } from "react";

import StatsCard from "@/components/dashboard/StatsCard";
import RecentActivity from "@/components/dashboard/RecentActivity";
import LearningProgress from "@/components/dashboard/LearningProgress";
import Leaderboard from "@/components/dashboard/Leaderboard";
import { ErrorBanner } from "@/components/ui/error-banner";
import { toast } from "@/hooks/use-toast";
import { normalizeError, safeFetchJson } from "@/lib/http";

function ContributorDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const [stats, setStats] = useState([
    {
      title: "Contributions",
      value: 0,
    },
    {
      title: "Pull Requests",
      value: 0,
    },
    {
      title: "Open Issues",
      value: 0,
    },
    {
      title: "Contributors",
      value: 0,
    },
  ]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const fetchGitHubData = async () => {
      setLoading(true);
      setError(null);

      try {
        const repo = "durdana3105/peer-learning";

        const [contributorsData, prsData, issuesData] = await Promise.all([
          safeFetchJson<Array<{ contributions: number }>>(
            `https://api.github.com/repos/${repo}/contributors`,
            { signal: controller.signal },
            { fallbackMessage: "Unable to load contributor data." },
          ),
          safeFetchJson<{ total_count?: number }>(
            `https://api.github.com/search/issues?q=repo:${repo}+type:pr`,
            { signal: controller.signal },
            { fallbackMessage: "Unable to load pull request data." },
          ),
          safeFetchJson<{ total_count?: number }>(
            `https://api.github.com/search/issues?q=repo:${repo}+type:issue+state:open`,
            { signal: controller.signal },
            { fallbackMessage: "Unable to load issue data." },
          ),
        ]);

        if (!active || controller.signal.aborted) {
          return;
        }

        const totalContributions = Array.isArray(contributorsData)
          ? contributorsData.reduce((acc: number, contributor) => acc + contributor.contributions, 0)
          : 0;

        setStats([
          {
            title: "Contributions",
            value: totalContributions,
          },
          {
            title: "Pull Requests",
            value: prsData.total_count || 0,
          },
          {
            title: "Open Issues",
            value: issuesData.total_count || 0,
          },
          {
            title: "Contributors",
            value: Array.isArray(contributorsData) ? contributorsData.length : 0,
          },
        ]);
      } catch (error) {
        if (!active || controller.signal.aborted) {
          return;
        }

        const normalized = normalizeError(error, "Unable to load GitHub contributor data.");

        setError(normalized.message);

        toast({
          title: "Contributor dashboard unavailable",
          description: normalized.message,
          variant: "destructive",
        });
      } finally {
        if (active && !controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchGitHubData();

    return () => {
      active = false;
      controller.abort();
    };
  }, [retryNonce]);

  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-12">
      <div className="max-w-7xl mx-auto px-6 md:px-8">

        {/* Header */}
        <div className="mb-10">

          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 text-sm font-medium mb-6">
            🚀 Community Contributor Space
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-5">
            Contributor{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
              Dashboard
            </span>
          </h1>

          <p className="text-zinc-400 text-lg md:text-xl max-w-3xl leading-relaxed">
            Track your real-time GitHub contributions inside the PeerLearn repository.
          </p>

          <p className="mt-3 text-sm text-cyan-300/80">
            {loading ? "Refreshing GitHub stats..." : "Live repository data is synced from GitHub."}
          </p>

        </div>

        {error ? (
          <div className="mb-8">
            <ErrorBanner
              title="Could not load GitHub stats"
              description={error}
              actionLabel="Retry"
              onAction={() => setRetryNonce((current) => current + 1)}
            />
          </div>
        ) : null}

        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 p-8 md:p-10 mb-12">

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.15),transparent_40%)]"></div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Open Source Contributions 🚀
              </h2>

              <p className="text-zinc-300 text-lg max-w-2xl leading-relaxed">
                Live repository insights from the PeerLearn GitHub project.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">

              <div className="bg-black/30 border border-cyan-500/10 backdrop-blur-xl rounded-2xl px-6 py-5">
                <p className="text-zinc-400 text-sm mb-1">
                  Repository
                </p>

                <h3 className="text-lg font-bold text-cyan-400">
                  peer-learning
                </h3>
              </div>

              <div className="bg-black/30 border border-cyan-500/10 backdrop-blur-xl rounded-2xl px-6 py-5">
                <p className="text-zinc-400 text-sm mb-1">
                  Organization
                </p>

                <h3 className="text-lg font-bold text-purple-400">
                  GitHub
                </h3>
              </div>

            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8 mb-12">
          {stats.map((item, index) => (
            <StatsCard
              key={index}
              title={item.title}
              value={item.value}
            />
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">

          <RecentActivity />

          <LearningProgress />

        </div>

        {/* Leaderboard */}
        <Leaderboard />

      </div>
    </div>
  );
}

export default ContributorDashboard;