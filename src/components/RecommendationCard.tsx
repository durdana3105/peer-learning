import { useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  GraduationCap,
  Users,
  Star,
  Compass,
  ArrowRight,
  TrendingUp,
  BrainCircuit
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Resource,
  Mentor,
  StudyGroup,
  TopicRecommendation
} from "@/integrations/recommendationEngine";

interface RecommendationCardProps {
  type: "resource" | "mentor" | "study_group" | "topic";
  item: any;
  onAction?: (itemId: string, itemType: string, actionType: string) => void;
  index?: number;
}

export default function RecommendationCard({
  type,
  item,
  onAction,
  index = 0
}: RecommendationCardProps) {
  const [actionState, setActionState] = useState<"idle" | "loading" | "done">("idle");
  
  // Animation settings matching the peer learning layout
  const cardVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { delay: index * 0.08, duration: 0.4 } 
    }
  };

  const handleActionClick = async (itemId: string, actionType: string) => {
    if (actionState !== "idle") return;
    
    setActionState("loading");
    
    // Simulate real-time secure database transactions/API delay for visual response
    await new Promise(resolve => setTimeout(resolve, 850));
    
    if (onAction) {
      onAction(itemId, type, actionType);
    }
    
    setActionState("done");
  };

  // 1️⃣ RESOURCE CARD
  if (type === "resource") {
    const res = item as Resource;
    
    // Difficulty border/text colors
    const diffColor = 
      res.difficulty === "beginner" ? "text-green-400 border-green-500/20 bg-green-500/10" :
      res.difficulty === "intermediate" ? "text-cyan-400 border-cyan-500/20 bg-cyan-500/10" :
      "text-purple-400 border-purple-500/20 bg-purple-500/10";

    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover={{ y: -5, scale: 1.01 }}
        className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-5 shadow-xl transition-all duration-300 flex flex-col justify-between h-full"
      >
        {/* Hover Glow */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-start gap-2 mb-3">
            <span className={`rounded-full px-3 py-0.5 text-[10px] font-bold border capitalize ${diffColor}`}>
              {res.difficulty}
            </span>
            <Badge variant="outline" className="border-white/10 text-slate-300 capitalize text-[10px]">
              {res.type}
            </Badge>
          </div>

          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition duration-300 line-clamp-1">
            {res.title}
          </h3>
          
          <p className="text-sm text-slate-400 line-clamp-2 mb-4">
            {res.description}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {res.tags.map(tag => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-slate-300">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="relative z-10 mt-auto pt-2">
          <Button
            size="sm"
            disabled={actionState === "loading"}
            onClick={() => handleActionClick(res.id, "view")}
            className={`w-full rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-1.5 ${
              actionState === "done"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 cursor-default"
                : "bg-gradient-to-r from-cyan-400 to-blue-500 text-black hover:opacity-90"
            }`}
          >
            {actionState === "idle" && (
              <>
                <BookOpen size={14} />
                Start Learning
              </>
            )}
            {actionState === "loading" && (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                Launching...
              </>
            )}
            {actionState === "done" && (
              <>
                <BookOpen size={14} className="animate-pulse" />
                Active Lesson ✓
              </>
            )}
          </Button>
        </div>
      </motion.div>
    );
  }

  // 2️⃣ MENTOR CARD
  if (type === "mentor") {
    const mentor = item as Mentor;
    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover={{ y: -5, scale: 1.01 }}
        className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-5 shadow-xl transition-all duration-300 flex flex-col justify-between h-full"
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5" />

        <div className="relative z-10">
          <div className="flex items-start gap-3.5 mb-3">
            <div className="relative">
              <img
                src={mentor.avatar_url}
                alt={mentor.name}
                className="h-12 w-12 rounded-xl object-cover border border-white/10"
              />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-black" />
            </div>
            
            <div className="min-w-0">
              <h4 className="text-base font-bold text-white truncate">{mentor.name}</h4>
              <div className="flex items-center gap-1 text-xs text-yellow-400 mt-0.5">
                <Star size={12} className="fill-yellow-400" />
                <span className="font-semibold text-[11px]">{mentor.rating}</span>
                <span className="text-[10px] text-slate-500">(15+ sessions)</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-400 line-clamp-2 mb-4 leading-relaxed">
            {mentor.bio}
          </p>

          <div className="space-y-1 mb-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Expertise</p>
            <div className="flex flex-wrap gap-1">
              {mentor.teach_subjects.slice(0, 3).map(sub => (
                <span key={sub} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  {sub}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-auto pt-2 flex gap-2">
          <Button
            size="sm"
            disabled={actionState === "loading"}
            onClick={() => handleActionClick(mentor.id, "join")}
            className={`flex-1 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-1 ${
              actionState === "done"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 cursor-default"
                : "bg-gradient-to-r from-green-400 to-emerald-500 text-black hover:opacity-90"
            }`}
          >
            {actionState === "idle" && (
              <>
                <GraduationCap size={14} />
                Connect
              </>
            )}
            {actionState === "loading" && (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                Connecting...
              </>
            )}
            {actionState === "done" && (
              <>
                <GraduationCap size={14} className="animate-pulse" />
                Connected ✓
              </>
            )}
          </Button>
        </div>
      </motion.div>
    );
  }

  // 3️⃣ STUDY GROUP CARD
  if (type === "study_group") {
    const group = item as StudyGroup;
    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover={{ y: -5, scale: 1.01 }}
        className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-5 shadow-xl transition-all duration-300 flex flex-col justify-between h-full"
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5" />

        <div className="relative z-10">
          <div className="flex justify-between items-center gap-2 mb-3">
            <span className="flex items-center gap-1 text-[10px] text-purple-400 font-semibold bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-full">
              <Users size={10} />
              {group.members_count} Members
            </span>
          </div>

          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-300 transition duration-300 line-clamp-1">
            {group.topic}
          </h3>
          
          <p className="text-sm text-slate-400 line-clamp-2 mb-4 leading-relaxed">
            {group.description}
          </p>

          <div className="flex flex-wrap gap-1 mb-4">
            {group.skill_tags.map(tag => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="relative z-10 mt-auto pt-2">
          <Button
            size="sm"
            disabled={actionState === "loading"}
            onClick={() => handleActionClick(group.id, "join")}
            className={`w-full rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-1.5 ${
              actionState === "done"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/20 cursor-default"
                : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90"
            }`}
          >
            {actionState === "idle" && (
              <>
                Join Group
                <ArrowRight size={14} />
              </>
            )}
            {actionState === "loading" && (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Joining...
              </>
            )}
            {actionState === "done" && (
              <>
                Joined ✓
                <ArrowRight size={14} className="animate-pulse" />
              </>
            )}
          </Button>
        </div>
      </motion.div>
    );
  }

  // 4️⃣ TOPIC RECOMMENDATION CARD
  const topic = item as TopicRecommendation;
  const diffColor = 
    topic.difficulty === "beginner" ? "text-green-400 border-green-500/20 bg-green-500/10" :
    topic.difficulty === "intermediate" ? "text-cyan-400 border-cyan-500/20 bg-cyan-500/10" :
    "text-purple-400 border-purple-500/20 bg-purple-500/10";

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -4, scale: 1.01 }}
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-5 shadow-xl transition-all duration-300 flex flex-col justify-between h-full"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-gradient-to-br from-yellow-500/5 via-transparent to-amber-500/5" />

      <div className="relative z-10">
        <div className="flex justify-between items-center gap-2 mb-3">
          <span className="flex items-center gap-1 text-[10px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
            <TrendingUp size={10} />
            Trending Topic
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold border capitalize ${diffColor}`}>
            {topic.difficulty}
          </span>
        </div>

        <h3 className="text-xl font-black text-white mb-2 tracking-tight group-hover:text-amber-300 transition duration-300">
          # {topic.topic}
        </h3>
        
        <p className="text-xs text-slate-400 italic mb-4">
          💡 {topic.reason}
        </p>
      </div>

      <div className="relative z-10 mt-auto pt-2">
        <Button
          size="sm"
          variant="outline"
          disabled={actionState === "loading"}
          onClick={() => handleActionClick(topic.topic, "search")}
          className={`w-full rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-center gap-1 transition-all duration-300 ${
            actionState === "done"
              ? "bg-amber-500/10 text-amber-300 border border-amber-500/30 cursor-default hover:text-amber-300"
              : ""
          }`}
        >
          {actionState === "idle" && (
            <>
              <BrainCircuit size={12} />
              Explore Topic
            </>
          )}
          {actionState === "loading" && (
            <>
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Searching...
            </>
          )}
          {actionState === "done" && (
            <>
              <BrainCircuit size={12} className="animate-pulse" />
              Discovered ✓
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
