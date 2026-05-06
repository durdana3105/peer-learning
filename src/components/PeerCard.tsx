import { motion } from "framer-motion";
import {
  Star,
  BookOpen,
  GraduationCap,
  Trophy,
  Flame,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { User } from "@/data/mockData";

interface PeerCardProps {
  peer: User;
  onConnect?: () => void;
  index?: number;
}

const PeerCard = ({
  peer,
  onConnect,
  index = 0,
}: PeerCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.1,
        duration: 0.5,
      }}
      whileHover={{
        y: -6,
        scale: 1.01,
      }}
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-5 shadow-xl transition-all duration-300"
    >
      {/* Glow Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-gradient-to-br from-green-400/10 via-transparent to-emerald-500/10" />

      {/* Top Section */}
      <div className="relative z-10 flex items-start gap-4">

        {/* Avatar */}
        <div className="relative">
          <img
            src={peer.avatar}
            alt={peer.name}
            className="h-16 w-16 rounded-2xl object-cover border border-white/10"
          />

          <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-400 border-2 border-black" />
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">

          <div className="flex items-center justify-between gap-2">

            <h3 className="truncate text-lg font-bold text-white">
              {peer.name}
            </h3>

            {peer.matchScore && (
              <span className="shrink-0 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">
                {peer.matchScore}% Match
              </span>
            )}
          </div>

          {/* Rating + Sessions */}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-emerald-300/70">

            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{peer.rating || 0}</span>
            </div>

            <div className="flex items-center gap-1">
              <Trophy className="h-4 w-4 text-green-400" />
              <span>
                {peer.sessionsCompleted || 0} Sessions
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Flame className="h-4 w-4 text-orange-400" />
              <span>{peer.points || 0} XP</span>
            </div>

          </div>
        </div>
      </div>

      {/* Bio */}
      <p className="relative z-10 mt-4 line-clamp-2 text-sm leading-relaxed text-emerald-200/70">
        {peer.bio || "Passionate learner and collaborator."}
      </p>

      {/* Subjects */}
      <div className="relative z-10 mt-5 space-y-3">

        {/* Teach */}
        <div className="flex items-start gap-2">
          <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />

          <div>
            <p className="text-xs font-medium text-emerald-300/60 mb-1">
              Teaches
            </p>

            <div className="flex flex-wrap gap-1.5">
              {peer.teachSubjects?.slice(0, 3).map((s) => (
                <Badge
                  key={s}
                  className="rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-[10px] text-green-300 hover:bg-green-500/20"
                >
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Learn */}
        <div className="flex items-start gap-2">
          <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />

          <div>
            <p className="text-xs font-medium text-emerald-300/60 mb-1">
              Learning
            </p>

            <div className="flex flex-wrap gap-1.5">
              {peer.learnSubjects?.slice(0, 3).map((s) => (
                <Badge
                  key={s}
                  variant="outline"
                  className="rounded-full border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-emerald-100"
                >
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Badges */}
      {peer.badges?.length > 0 && (
        <div className="relative z-10 mt-4 flex flex-wrap gap-2">
          {peer.badges.map((b) => (
            <span
              key={b}
              className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2 py-1 text-[10px] text-yellow-300"
            >
              {b}
            </span>
          ))}
        </div>
      )}

      {/* Buttons */}
      <div className="relative z-10 mt-6 flex gap-3">

        <Button
          size="sm"
          onClick={onConnect}
          className="flex-1 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 font-semibold text-black hover:scale-[1.02] transition"
        >
          Connect
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="flex-1 rounded-xl border-white/10 bg-white/5 hover:bg-white/10"
        >
          View Profile
        </Button>
      </div>
    </motion.div>
  );
};

export default PeerCard;