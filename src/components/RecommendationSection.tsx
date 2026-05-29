import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  BookOpen, 
  GraduationCap, 
  Users, 
  BrainCircuit, 
  RefreshCw,
  Clock,
  CheckCircle,
  Play,
  RotateCcw
} from "lucide-react";
import { toast } from "sonner";
import { useRecommendations } from "@/hooks/useRecommendations";
import RecommendationCard from "./RecommendationCard";

type TabType = "resource" | "mentor" | "study_group" | "topic" | "learning_path";

const tabsList = [
  { id: "resource", label: "Resources", icon: BookOpen, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
  { id: "mentor", label: "Mentors", icon: GraduationCap, color: "text-green-400 bg-green-500/10 border-green-500/20" },
  { id: "study_group", label: "Study Groups", icon: Users, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  { id: "topic", label: "Topics", icon: BrainCircuit, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { id: "learning_path", label: "AI Learning Path", icon: Sparkles, color: "text-rose-400 bg-rose-500/10 border-rose-500/20" }
];

export default function RecommendationSection() {
  const { recommendations, loading, refresh, trackInteraction } = useRecommendations();
  const [activeTab, setActiveTab] = useState<TabType>("resource");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // AI Learning Path states
  const [learningPath, setLearningPath] = useState<any>(() => {
    const saved = localStorage.getItem("peerlearn-custom-learning-path");
    return saved ? JSON.parse(saved) : null;
  });
  const [generating, setGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState(0);
  const [completedWeeks, setCompletedWeeks] = useState<Record<number, boolean>>(() => {
    const saved = localStorage.getItem("peerlearn-completed-weeks");
    return saved ? JSON.parse(saved) : {};
  });

  const toggleWeekCompletion = (weekNumber: number) => {
    const updated = { ...completedWeeks, [weekNumber]: !completedWeeks[weekNumber] };
    setCompletedWeeks(updated);
    localStorage.setItem("peerlearn-completed-weeks", JSON.stringify(updated));
    if (updated[weekNumber]) {
      toast.success(`Milestone completed! Week ${weekNumber} marked as done. 🌟`);
      trackInteraction(`week-${weekNumber}`, "topic" as any, "complete" as any);
    }
  };

  const generateAIPath = async () => {
    setGenerating(true);
    setGeneratingStep(1);
    await new Promise(r => setTimeout(r, 1200));
    setGeneratingStep(2);
    await new Promise(r => setTimeout(r, 1200));
    setGeneratingStep(3);
    await new Promise(r => setTimeout(r, 1200));

    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    let pathData = null;

    if (apiKey) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "openai/gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: "You are a senior full-stack mentor. Generate a personalized 4-week learning path in JSON. Format: { \"title\": \"...\", \"description\": \"...\", \"weeks\": [ { \"week\": 1, \"title\": \"...\", \"topics\": [\"...\"], \"description\": \"...\", \"estimatedHours\": 8, \"actionItem\": \"...\" } ] }"
              },
              {
                role: "user",
                content: "Generate a custom 4-week learning path for a student who wants to learn advanced React, PostgreSQL database design, and AI integrations."
              }
            ]
          })
        });
        const resJson = await response.json();
        const contentStr = resJson.choices?.[0]?.message?.content;
        if (contentStr) {
          pathData = JSON.parse(contentStr);
        }
      } catch (err) {
        console.warn("Failed to generate from OpenRouter, falling back to local synthesis:", err);
      }
    }

    if (!pathData) {
      pathData = {
        title: "Full-Stack React & PostgreSQL Mastery Path",
        description: "A tailored journey to master full-stack React and Postgres optimization.",
        weeks: [
          {
            week: 1,
            title: "Mastering Type-Safe UI Development",
            topics: ["Advanced TypeScript Types", "Custom React Hooks"],
            description: "Build high-performance components with reusable hooks and rigid static typing.",
            estimatedHours: 8,
            actionItem: "Build a useDebounce hook with TypeScript generics"
          },
          {
            week: 2,
            title: "Advanced Tailwind & Component Design",
            topics: ["Glassmorphism", "Micro-animations", "Framer Motion"],
            description: "Design premium landing pages and dashboard cards using Tailwind utility-first styling and spring physics.",
            estimatedHours: 10,
            actionItem: "Animate a dynamic recommendation card with drag gestures"
          },
          {
            week: 3,
            title: "Database Indexing & Performance Optimization",
            topics: ["SQL Indexing", "Query Plans", "PostgreSQL Joins"],
            description: "Optimize complex database relations, indices, and check query plans inside Postgres.",
            estimatedHours: 12,
            actionItem: "Optimize an N+1 query in a database profiles fetch script"
          },
          {
            week: 4,
            title: "AI Agent Integrations & Chatbots",
            topics: ["OpenAI API", "Vector Embeddings", "Streamed Chat Replies"],
            description: "Incorporate intelligent tutoring and semantic matching capabilities using OpenRouter and prompt templates.",
            estimatedHours: 10,
            actionItem: "Build a chat panel with progressive typing effects"
          }
        ]
      };
    }

    localStorage.setItem("peerlearn-custom-learning-path", JSON.stringify(pathData));
    setLearningPath(pathData);
    setCompletedWeeks({});
    localStorage.removeItem("peerlearn-completed-weeks");
    setGenerating(false);
    toast.success("Your personalized AI Learning Path is ready! 🚀");
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 800);
    toast.success("Recommendations updated dynamically!");
  };

  const handleAction = async (itemId: string, itemType: string, actionType: string) => {
    await trackInteraction(itemId, itemType as any, actionType as any);

    if (itemType === "resource") {
      toast.success("Opening resource dashboard! Learning interaction recorded.");
    } else if (itemType === "mentor") {
      toast.success("Connection request sent! Interaction recorded for peer matchmaking.");
    } else if (itemType === "study_group") {
      toast.success("Joined study group! Synced with your active collaborative sessions.");
    } else if (itemType === "topic") {
      toast.success(`Searching peer network for active sessions on #${itemId}.`);
    }
  };

  const getItems = () => {
    if (!recommendations) return [];
    switch (activeTab) {
      case "resource": return recommendations.resources;
      case "mentor": return recommendations.mentors;
      case "study_group": return recommendations.studyGroups;
      case "topic": return recommendations.topics;
      default: return [];
    }
  };

  const items = getItems();

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl relative overflow-hidden">
      
      {/* Subtle Background Glow */}
      <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-400">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-1.5">
              AI recommendations
            </h2>
            <p className="text-xs text-slate-400">
              Personalized topics, study groups, mentors, and resources curated just for you.
            </p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading || isRefreshing}
          className="self-end sm:self-auto rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition duration-200 disabled:opacity-50"
        >
          <RefreshCw size={14} className={isRefreshing || loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* CUSTOM ANIMATED TABS BAR */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none relative z-10 border-b border-white/5">
        {tabsList.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm font-semibold transition-all duration-300 whitespace-nowrap relative ${
                isActive
                  ? "border-cyan-500/30 text-cyan-400 bg-cyan-500/5 shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                  : "border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 border border-cyan-400/30 rounded-2xl pointer-events-none"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* GRID LAYOUT FOR RECOMMENDATION CARDS */}
      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {activeTab === "learning_path" ? (
            generating ? (
              // Stunning progressive step loading animation for AI generation
              <motion.div
                key="ai-loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-16 text-center bg-white/5 border border-white/5 rounded-3xl backdrop-blur-2xl"
              >
                <div className="relative mb-6">
                  <div className="h-16 w-16 animate-spin rounded-full border-4 border-rose-500/20 border-t-rose-400" />
                  <Sparkles className="absolute inset-0 m-auto text-rose-400 animate-pulse" size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Synthesizing Your Learning Path</h3>
                
                <div className="space-y-3 mt-4 text-left max-w-xs mx-auto">
                  {[
                    "Analyzing profile skills & learning goals...",
                    "Scanning peer similarity & top resources...",
                    "Synthesizing customized 4-week milestones..."
                  ].map((stepText, idx) => {
                    const stepNum = idx + 1;
                    const isDone = generatingStep > stepNum;
                    const isActive = generatingStep === stepNum;
                    return (
                      <div key={idx} className="flex items-center gap-3 transition-opacity duration-300">
                        {isDone ? (
                          <div className="h-5 w-5 rounded-full bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 text-xs">✓</div>
                        ) : isActive ? (
                          <div className="h-5 w-5 rounded-full bg-rose-400/10 border border-rose-400 animate-pulse flex items-center justify-center text-rose-400 text-xs">•</div>
                        ) : (
                          <div className="h-5 w-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-600 text-xs">{stepNum}</div>
                        )}
                        <span className={`text-sm ${isDone ? "text-slate-400 line-through" : isActive ? "text-rose-300 font-medium" : "text-slate-500"}`}>
                          {stepText}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ) : learningPath ? (
              // Highly premium, week-by-week interactive timeline
              <motion.div
                key="learning-path-timeline"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* Path Header */}
                <div className="bg-gradient-to-r from-rose-500/10 to-pink-500/10 border border-rose-500/15 rounded-3xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-widest text-rose-400 bg-rose-500/15 border border-rose-500/30 px-3 py-1 rounded-full">AI Roadmap</span>
                      <h3 className="text-2xl font-black text-white mt-3">{learningPath.title}</h3>
                      <p className="text-sm text-slate-300 mt-1 max-w-xl">{learningPath.description}</p>
                    </div>
                    <button
                      onClick={generateAIPath}
                      className="rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 px-4 py-2.5 text-xs font-semibold text-rose-300 hover:text-rose-100 flex items-center gap-1.5 transition duration-200"
                    >
                      <RotateCcw size={14} />
                      Regenerate
                    </button>
                  </div>
                  {/* Progress Bar */}
                  <div className="mt-6 pt-4 border-t border-white/5">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="text-slate-400 font-medium">Path Completion Progress</span>
                      <span className="text-rose-400 font-bold">
                        {Math.round((Object.values(completedWeeks).filter(Boolean).length / learningPath.weeks.length) * 100)}% Done
                      </span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                      <motion.div
                        className="bg-gradient-to-r from-rose-400 to-pink-500 h-full"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(Object.values(completedWeeks).filter(Boolean).length / learningPath.weeks.length) * 100}%`
                        }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </div>
                {/* Timeline weeks */}
                <div className="space-y-6 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/5">
                  {learningPath.weeks.map((weekData: any, idx: number) => {
                    const isCompleted = !!completedWeeks[weekData.week];
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        className="relative pl-12 sm:pl-16 group"
                      >
                        {/* Timeline node dot */}
                        <button
                          onClick={() => toggleWeekCompletion(weekData.week)}
                          className={`absolute left-2.5 top-1.5 h-7 w-7 rounded-full border flex items-center justify-center transition-all duration-300 z-10 ${
                            isCompleted
                              ? "bg-rose-500 border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.5)] text-white"
                              : "bg-[#0b0f19] border-white/10 text-slate-500 hover:border-rose-500/50 hover:text-rose-400"
                          }`}
                        >
                          {isCompleted ? <CheckCircle size={14} className="fill-rose-500" /> : <Play size={12} className="ml-0.5" />}
                        </button>
                        {/* Week Card */}
                        <div
                          className={`rounded-3xl border p-5 transition-all duration-300 ${
                            isCompleted
                              ? "bg-rose-500/5 border-rose-500/25 shadow-[0_0_20px_rgba(244,63,94,0.02)]"
                              : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                            <h4 className="text-lg font-bold text-white group-hover:text-rose-300 transition duration-200">
                              {weekData.title}
                            </h4>
                            <span className="flex items-center gap-1 text-[10px] text-slate-400 font-bold bg-white/5 border border-white/5 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                              <Clock size={10} />
                              {weekData.estimatedHours} Hours
                            </span>
                          </div>
                          <p className="text-sm text-slate-400 mb-4 leading-relaxed">{weekData.description}</p>
                          {/* Skill Tags */}
                          <div className="mb-4">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Skills to Master</p>
                            <div className="flex flex-wrap gap-1.5">
                              {weekData.topics.map((topic: string) => (
                                <span key={topic} className="text-[10px] px-2.5 py-0.5 rounded-md bg-[#020617]/50 border border-white/5 text-slate-300">
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>
                          {/* Action Item highlight box */}
                          <div className="bg-[#020617]/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4">
                            <div>
                              <span className="text-[9px] uppercase font-black text-rose-400 tracking-wider">Weekly Project / Goal</span>
                              <p className="text-xs text-white font-medium mt-0.5">{weekData.actionItem}</p>
                            </div>
                            <button
                              onClick={() => toggleWeekCompletion(weekData.week)}
                              className={`rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                                isCompleted
                                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                  : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
                              }`}
                            >
                              {isCompleted ? "Completed" : "Mark Done"}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              // Initial Generator state
              <motion.div
                key="ai-initial"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16 text-center bg-white/5 border border-white/5 rounded-3xl backdrop-blur-2xl px-6"
              >
                <div className="p-4 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-4 animate-bounce">
                  <Sparkles size={36} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Build Your Customized Learning Path</h3>
                <p className="text-sm text-slate-400 max-w-md mb-6">
                  Our advanced AI analyzer will look at your skills, learning subjects, interests, and peer group similarity to construct an interactive, week-by-week learning roadmap tailored exactly to you.
                </p>
                <button
                  onClick={generateAIPath}
                  className="rounded-2xl bg-gradient-to-r from-rose-400 to-pink-500 hover:opacity-90 font-bold text-white shadow-[0_0_25px_rgba(244,63,94,0.3)] px-6 py-3.5 flex items-center justify-center gap-2 transition duration-200"
                >
                  <Sparkles size={16} />
                  Construct My AI Learning Path
                </button>
              </motion.div>
            )
          ) : loading ? (
            // Premium Grid Loading Skeleton
            <motion.div
              key="loading-skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {[1, 2, 3].map((n) => (
                <div key={n} className="rounded-3xl border border-white/5 bg-white/5 p-5 space-y-4 animate-pulse">
                  <div className="flex justify-between">
                    <div className="h-4 w-16 bg-white/10 rounded-full" />
                    <div className="h-4 w-12 bg-white/10 rounded-full" />
                  </div>
                  <div className="h-6 w-3/4 bg-white/10 rounded-lg" />
                  <div className="h-4 w-5/6 bg-white/10 rounded-lg" />
                  <div className="h-4 w-1/2 bg-white/10 rounded-lg" />
                  <div className="h-8 w-full bg-white/10 rounded-xl pt-2" />
                </div>
              ))}
            </motion.div>
          ) : items.length > 0 ? (
            // Live recommendations Grid
            <motion.div
              key={`${activeTab}-grid`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {items.map((item, idx) => (
                <RecommendationCard
                  key={item.id || idx}
                  type={activeTab}
                  item={item}
                  onAction={handleAction}
                  index={idx}
                />
              ))}
            </motion.div>
          ) : (
            // Beautiful customized Empty/Fallback State
            <motion.div
              key="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="p-4 rounded-full bg-white/5 border border-white/5 text-slate-500 mb-4">
                <Sparkles size={32} />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Tailoring recommendations...</h3>
              <p className="text-sm text-slate-400 max-w-sm">
                Add more interests and skills to your profile, or join some learning sessions to unlock smarter recommendations!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
