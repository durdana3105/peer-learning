import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Users,
  Activity,
  UsersRound,
  TrendingUp,
  Zap,
  BrainCircuit,
  Code2,
  Globe,
  Rocket,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const communities = [
  {
    name: "AIML Community",
    subtitle: "Build and deploy practical AI projects with peers and mentors.",
    icon: BrainCircuit,
    members: "4.8K members",
    activity: "230 active this week",
    online: "142 online",
    growth: "+12% this week",
    activityPercent: "78% active",
    primaryTag: "Beginner Friendly",
    secondaryTag: "Project Based",
    accentFrom: "from-cyan-400/25",
    accentTo: "to-blue-500/20",
    glow: "hover:shadow-[0_0_55px_rgba(34,211,238,0.35)]",
    isFeatured: false,
  },
  {
    name: "DSA Warriors",
    subtitle: "Daily coding challenges, mock contests, and interview drills.",
    icon: Code2,
    members: "6.1K members",
    activity: "420 active this week",
    online: "289 online",
    growth: "+24% this week",
    activityPercent: "92% active",
    primaryTag: "Interview Focus",
    secondaryTag: "Daily Challenges",
    accentFrom: "from-emerald-400/25",
    accentTo: "to-lime-500/20",
    glow: "hover:shadow-[0_0_55px_rgba(52,211,153,0.32)]",
    isFeatured: true,
  },
  {
    name: "Web Dev Hub",
    subtitle: "Collaborate on full-stack builds from UI polish to deployment.",
    icon: Globe,
    members: "5.4K members",
    activity: "300 active this week",
    online: "167 online",
    growth: "+18% this week",
    activityPercent: "85% active",
    primaryTag: "Build In Public",
    secondaryTag: "Portfolio Ready",
    accentFrom: "from-sky-400/25",
    accentTo: "to-indigo-500/20",
    glow: "hover:shadow-[0_0_55px_rgba(56,189,248,0.3)]",
    isFeatured: false,
  },
  {
    name: "Hackathon Teams",
    subtitle: "Find teammates, brainstorm ideas, and ship under pressure.",
    icon: Rocket,
    members: "3.2K members",
    activity: "150 active this week",
    online: "89 online",
    growth: "+9% this week",
    activityPercent: "71% active",
    primaryTag: "Team Match",
    secondaryTag: "Fast Paced",
    accentFrom: "from-amber-400/25",
    accentTo: "to-orange-500/20",
    glow: "hover:shadow-[0_0_55px_rgba(251,146,60,0.32)]",
    isFeatured: false,
  },
  {
    name: "Interview Prep",
    subtitle: "Ace technical rounds with mock interviews and peer feedback.",
    icon: Briefcase,
    members: "4.1K members",
    activity: "260 active this week",
    online: "134 online",
    growth: "+15% this week",
    activityPercent: "81% active",
    primaryTag: "Career Boost",
    secondaryTag: "Mock Interviews",
    accentFrom: "from-fuchsia-400/25",
    accentTo: "to-pink-500/20",
    glow: "hover:shadow-[0_0_55px_rgba(232,121,249,0.32)]",
    isFeatured: false,
  },
];

export function Communities() {
  return (
    <section id="community" className="container px-6 py-24">
      <h2 className="mb-4 text-center text-5xl font-black tracking-tight text-white">
        Explore Communities
      </h2>
      <p className="mx-auto mb-16 max-w-3xl text-center text-base text-slate-300/75 md:text-lg">
        Discover focused peer circles, track live activity, and join communities
        designed around your goals.
      </p>

      <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3 justify-items-center xl:justify-items-stretch">
        {" "}
        {communities.map((community, i) => {
          const Icon = community.icon;
          const isFeatured = community.isFeatured;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              viewport={{ once: true }}
              whileHover={{ y: -12, scale: 1.02 }}
              className={`group relative overflow-hidden rounded-[28px] border bg-white/10 p-7 backdrop-blur-2xl transition-all duration-300 ${
                isFeatured
                  ? "border-cyan-400/60 shadow-xl shadow-cyan-500/10 xl:col-span-1"
                  : "border-white/15 hover:border-white/35"
              } ${community.glow}`}
            >
              {/* Subtle background gradient */}
              <div
                className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br ${community.accentFrom} ${community.accentTo} opacity-70`}
              />

              {isFeatured && (
                <div className="absolute -right-1 -top-1 z-20 rounded-bl-2xl rounded-tr-[28px] bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-1 text-xs font-bold text-white shadow-md">
                  MOST POPULAR
                </div>
              )}

              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-cyan-200 shadow-[0_0_30px_rgba(255,255,255,0.08)] transition-transform group-hover:scale-110">
                  <Icon className="h-7 w-7" />
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  <span className="flex items-center gap-1.5 rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs font-semibold text-white">
                    <Zap className="h-3 w-3" />
                    {community.primaryTag}
                  </span>
                  <span className="rounded-full border border-white/25 bg-black/30 px-3 py-1 text-xs font-medium text-slate-200/90">
                    {community.secondaryTag}
                  </span>
                </div>
              </div>

              <h3
                className={`text-xl font-bold text-white ${isFeatured ? "text-2xl" : ""}`}
              >
                {community.name}
              </h3>

              <p className="mt-3 min-h-[52px] text-sm leading-6 text-slate-200/90">
                {community.subtitle}
              </p>

              <div className="mt-6 space-y-2.5 text-sm">
                <div className="flex items-center gap-2 text-slate-100/90">
                  <Users className="h-4 w-4 text-cyan-200" />
                  {community.members}
                </div>
                <div className="flex items-center gap-2 text-slate-100/90">
                  <Activity className="h-4 w-4 text-cyan-200" />
                  {community.activity}
                </div>
                <div className="flex items-center gap-2 text-slate-100/90">
                  <UsersRound className="h-4 w-4 text-emerald-400" />
                  {community.online}
                </div>
                <div className="flex items-center gap-2 text-slate-100/90">
                  <TrendingUp className="h-4 w-4 text-amber-400" />
                  {community.growth}
                </div>
                <div className="flex items-center gap-2 text-slate-100/90">
                  <Zap className="h-4 w-4 text-violet-400" />
                  {community.activityPercent}
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  variant="outline"
                  className="rounded-xl border-white/40 bg-white/5 text-slate-100 hover:bg-white/15 hover:border-white/60 flex-1"
                >
                  <Link to="/discover">Explore</Link>
                </Button>
                <Button
                  asChild
                  className="rounded-xl bg-white text-slate-900 hover:bg-cyan-100 flex-1 font-semibold"
                >
                  <Link to="/signup">Join Community</Link>
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
