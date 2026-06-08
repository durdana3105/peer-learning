import { useEffect, useState, useMemo} from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/useAuth";
import { Loader2, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type Session = {
  id: string;
  role: string;
  overall_score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  created_at: string;
};
/**
 * Displays the user's mock interview history with score progression chart
 * and expandable session details including strengths and improvement areas.
 */

const InterviewHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchSessions = async () => {
      const { data, error } = await (supabase as any)
        .from("interview_sessions")
        .select("id, role, overall_score, summary, strengths, improvements, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Failed to fetch sessions:", error);
        setFetchError("Failed to load interview history. Please try again.");
      } else {
        setSessions(data ?? []);
      }
      setLoading(false);
    };
    fetchSessions();
  }, [user]);

const recurringImprovements = useMemo(() => {
  const freq: Record<string, number> = {};
  sessions.forEach(s => s.improvements.forEach(imp => {
    freq[imp] = (freq[imp] || 0) + 1;
  }));
  return Object.entries(freq)
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
}, [sessions]);

  const chartData = sessions.map((s, i) => ({
    session: `#${i + 1}`,
    score: s.overall_score,
    role: s.role,
  }));

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-8 pt-24">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/mock-interview")}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft />
          </button>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            Interview History
          </h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
          </div>

        ) : fetchError ? (
          <div className="text-center py-20 text-red-400">
            <p>{fetchError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-slate-800 hover:bg-slate-700 px-6 py-3 rounded-xl text-white font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        ) :sessions.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p className="text-lg">No interviews yet.</p>
            <button
              onClick={() => navigate("/mock-interview")}
              className="mt-4 bg-cyan-600 hover:bg-cyan-500 px-6 py-3 rounded-xl text-white font-medium transition-colors"
            >
              Start your first interview
            </button>
          </div>
        ) : (
          <>
            {/* Score Chart */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <h2 className="text-lg font-semibold mb-4 text-slate-300">Score Progression</h2>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="session" stroke="#64748b" />
                  <YAxis domain={[0, 100]} stroke="#64748b" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px" }}
                    labelStyle={{ color: "#94a3b8" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#22d3ee"
                    strokeWidth={2}
                    dot={{ fill: "#22d3ee", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {recurringImprovements.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <h2 className="text-lg font-semibold mb-4 text-slate-300">
                  🔁 Recurring Improvement Areas
                </h2>
                <ul className="space-y-2">
                  {recurringImprovements.map(([area, count]) => (
                    <li key={area} className="flex justify-between items-center text-sm text-slate-300">
                      <span>• {area}</span>
                      <span className="text-yellow-400 text-xs">{count} sessions</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Session List */}
            <div className="space-y-4">
              {[...sessions].reverse().map((session) => (
                <div
                  key={session.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"
                >
                  <button
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-800/50 transition-colors"
                    onClick={() => setExpandedId(expandedId === session.id ? null : session.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`text-2xl font-bold ${session.overall_score >= 80 ? "text-green-400" : session.overall_score >= 60 ? "text-yellow-400" : "text-red-400"}`}>
                        {session.overall_score}
                        <span className="text-sm text-slate-500">/100</span>
                      </div>
                      <div>
                        <p className="font-semibold">{session.role}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(session.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    {expandedId === session.id ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                  </button>

                  {expandedId === session.id && (
                    <div className="px-5 pb-5 space-y-4 border-t border-slate-800 pt-4">
                      <p className="text-slate-300">{session.summary}</p>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                          <h4 className="text-emerald-400 font-semibold mb-2">Strengths</h4>
                          <ul className="space-y-1">
                            {session.strengths.map((s, i) => (
                              <li key={i} className="text-slate-300 text-sm flex gap-2">
                                <span className="text-emerald-500">•</span>{s}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl">
                          <h4 className="text-yellow-400 font-semibold mb-2">Improvements</h4>
                          <ul className="space-y-1">
                            {session.improvements.map((s, i) => (
                              <li key={i} className="text-slate-300 text-sm flex gap-2">
                                <span className="text-yellow-500">•</span>{s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InterviewHistory;