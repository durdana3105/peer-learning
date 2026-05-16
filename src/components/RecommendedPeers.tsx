import { motion } from "framer-motion";
import { MatchResult } from "@/utils/recommender";

interface RecommendedPeersProps {
  peers: MatchResult[];
}

const RecommendedPeers = ({ peers }: RecommendedPeersProps) => {
  if (!peers || peers.length === 0) {
    return (
      <div className="flex h-40 w-full items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
        <p className="text-slate-400">No peers recommended at this time. Explore more topics!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {peers.map((peer, i) => (
        <motion.div
          key={peer.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.4 }}
          whileHover={{ y: -5, scale: 1.02 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-xl transition-all"
        >
          {/* Top section with avatar and Match Badge */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <img
                src={peer.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${peer.name}`}
                alt={peer.name}
                className="h-12 w-12 rounded-full object-cover border border-white/10"
              />
              <div>
                <h3 className="font-bold text-white text-lg leading-tight">{peer.name}</h3>
              </div>
            </div>
            <span className="shrink-0 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">
              {peer.matchScore}% Match
            </span>
          </div>

          {/* Skills Section */}
          <div className="mt-4 space-y-1">
            <p className="text-xs font-medium text-emerald-300/60 uppercase tracking-wider">Top Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {(Array.isArray(peer.skills) && peer.skills.length > 0) ? (
                peer.skills.slice(0, 3).map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-medium text-cyan-300"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-400 italic">No skills listed</span>
              )}
            </div>
          </div>

          {/* Connect Button */}
          <div className="mt-6">
            <button className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:opacity-90 active:scale-95">
              Connect
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default RecommendedPeers;
