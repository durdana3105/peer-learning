import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Users, Activity, BrainCircuit, Code2, Globe, Rocket, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";

const communities = [
  {
    name: "AIML Community",
    subtitle: "Build and deploy practical AI projects with peers and mentors.",
    icon: BrainCircuit,
    members: "4.8K members",
    activity: "230 active this week",
    primaryTag: "Beginner Friendly",
    secondaryTag: "Project Based",
    accentFrom: "from-cyan-400/25",
    accentTo: "to-blue-500/20",
    glow: "hover:shadow-[0_0_55px_rgba(34,211,238,0.35)]",
  },
  {
    name: "DSA Warriors",
    subtitle: "Daily coding challenges, mock contests, and interview drills.",
    icon: Code2,
    members: "6.1K members",
    activity: "420 active this week",
    primaryTag: "Interview Focus",
    secondaryTag: "Daily Challenges",
    accentFrom: "from-emerald-400/25",
    accentTo: "to-lime-500/20",
    glow: "hover:shadow-[0_0_55px_rgba(52,211,153,0.32)]",
  },
  {
    name: "Web Dev Hub",
    subtitle: "Collaborate on full-stack builds from UI polish to deployment.",
    icon: Globe,
    members: "5.4K members",
    activity: "300 active this week",
    primaryTag: "Build In Public",
    secondaryTag: "Portfolio Ready",
    accentFrom: "from-sky-400/25",
    accentTo: "to-indigo-500/20",
    glow: "hover:shadow-[0_0_55px_rgba(56,189,248,0.3)]",
  },
  {
    name: "Hackathon Teams",
    subtitle: "Find teammates, brainstorm ideas, and ship under pressure.",
    icon: Rocket,
    members: "3.2K members",
    activity: "150 active this week",
    primaryTag: "Team Match",
    secondaryTag: "Fast Paced",
    accentFrom: "from-amber-400/25",
    accentTo: "to-orange-500/20",
    glow: "hover:shadow-[0_0_55px_rgba(251,146,60,0.32)]",
  },
  {
    name: "Interview Prep",
    subtitle: "Ace technical rounds with mock interviews and peer feedback.",
    icon: Briefcase,
    members: "4.1K members",
    activity: "260 active this week",
    primaryTag: "Career Boost",
    secondaryTag: "Mock Interviews",
    accentFrom: "from-fuchsia-400/25",
    accentTo: "to-pink-500/20",
    glow: "hover:shadow-[0_0_55px_rgba(232,121,249,0.32)]",
  },
];

export function Communities() {
  return (
    <section id="community" className="container px-6 py-24">
      <h2 className="mb-4 text-center text-5xl font-black">
        Explore Communities
      </h2>

      <p className="mx-auto mb-16 max-w-3xl text-center text-base text-slate-300/75 md:text-lg">
        Discover focused peer circles, track live activity, and join
        communities designed around your goals.
      </p>

      <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
        {communities.map((community, i) => {
          const Icon = community.icon;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              viewport={{ once: true }}
              whileHover={{ y: -10, scale: 1.02 }}
              className={`group relative overflow-hidden rounded-[28px] border border-white/15 bg-white/10 p-7 backdrop-blur-2xl transition-all duration-300 hover:border-white/35 ${community.glow}`}
            >
              <div
                className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br ${community.accentFrom} ${community.accentTo} opacity-80`}
              />

              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-cyan-200 shadow-[0_0_30px_rgba(255,255,255,0.08)]">
                  <Icon className="h-7 w-7" />
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-medium text-slate-200">
                    {community.primaryTag}
                  </span>
                  <span className="rounded-full border border-white/25 bg-black/20 px-3 py-1 text-xs font-medium text-slate-200/90">
                    {community.secondaryTag}
                  </span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-white">
                {community.name}
              </h3>
              <p className="mt-3 min-h-[52px] text-sm leading-6 text-slate-200/80">
                {community.subtitle}
              </p>

              <div className="mt-5 space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-100/90">
                  <Users className="h-4 w-4 text-cyan-200" />
                  {community.members}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-100/90">
                  <Activity className="h-4 w-4 text-cyan-200" />
                  {community.activity}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  asChild
                  className="rounded-xl bg-white text-slate-900 hover:bg-cyan-100"
                >
                  <Link to="/discover">Explore</Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="rounded-xl border-white/35 bg-white/5 text-slate-100 hover:bg-white/15"
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
