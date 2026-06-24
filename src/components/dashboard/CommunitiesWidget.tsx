import { Users, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

// Mock data
const joinedCommunities = [
  { id: "1", name: "Frontend Masters", members: 1240, active: 34, color: "bg-blue-500" },
  { id: "2", name: "UI/UX Designers", members: 890, active: 12, color: "bg-purple-500" },
  { id: "3", name: "React Enthusiasts", members: 2100, active: 89, color: "bg-cyan-500" },
];

export default function CommunitiesWidget() {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Users size={20} className="text-blue-400" />
          Communities
        </h3>
        <span className="text-sm font-medium text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
          {joinedCommunities.length} Joined
        </span>
      </div>

      <div className="space-y-3 flex-1">
        {joinedCommunities.map((community) => (
          <div
            key={community.id}
            className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/50 border border-slate-700/30 hover:border-slate-600 transition-colors group cursor-pointer"
            role="button"
            tabIndex={0}
            onClick={() => { /* Navigate to community */ }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                // Navigate to community
              }
            }}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${community.color} flex items-center justify-center text-white font-bold text-lg shadow-inner`}>
                {community.name.charAt(0)}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                  {community.name}
                </h4>
                <p className="text-xs text-slate-400">
                  {community.members.toLocaleString()} members
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-slate-300">{community.active} active</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Link
        to="/discover"
        className="mt-4 flex items-center justify-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors py-2 rounded-xl hover:bg-cyan-400/10"
      >
        Explore More <ExternalLink size={14} />
      </Link>
    </div>
  );
}
