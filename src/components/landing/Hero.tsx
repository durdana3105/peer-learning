import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Flame, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroIllustration from "@/assets/hero-illustration.png";

type HeroProps = {
  streak: number | null;
};

export function Hero({ streak }: HeroProps) {
  return (
    <section className="container relative grid items-center gap-16 px-6 pb-24 pt-24 lg:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-5 py-2 text-sm text-cyan-300 backdrop-blur-xl">
          <Sparkles size={16} />
          Student Powered Learning Ecosystem
        </div>

        <h1 className="text-5xl font-black leading-tight tracking-tight md:text-7xl">
          Learn From
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500 bg-clip-text text-transparent">
            {" "}
            Seniors
          </span>
          .
          <br />
          Grow With
          <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-sky-500 bg-clip-text text-transparent">
            {" "}
            Peers
          </span>
          .
        </h1>

        <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-300/80 md:text-xl">
          Join live mentorship sessions, build projects with classmates, solve
          doubts instantly, and become part of a futuristic collaborative
          learning community.
        </p>

        <div className="mt-10 flex flex-wrap gap-5">
          <Link to="/signup">
            <Button className="rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-8 py-7 text-base font-bold text-black shadow-[0_0_40px_rgba(34,211,238,0.4)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_60px_rgba(34,211,238,0.6)]">
              Join as Learner
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/become-mentor">
            <Button
              variant="outline"
              className="rounded-2xl border border-cyan-400/40 bg-white/5 px-8 py-7 text-base font-semibold text-cyan-300 backdrop-blur-xl transition-all duration-300 hover:bg-cyan-400/10 hover:scale-105"
            >
              Become a Mentor.
            </Button>
          </Link>
        </div>

        <div className="mt-12 flex flex-wrap gap-4">
          {[
            "🔥 120 students joined today",
            "🎥 12 live sessions running",
            "💬 45 active discussions",
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05 }}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-300 backdrop-blur-2xl"
            >
              {item}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Hero Right */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="relative"
      >
        <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-3xl" />

        <img
          src={heroIllustration}
          alt="hero"
          className="relative z-10 drop-shadow-[0_0_60px_rgba(34,211,238,0.2)]"
        />

        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute -left-16 top-32 z-0 rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-2xl md:top-36"
        >
          <div className="flex items-center gap-3">
            <Flame className="text-cyan-400" />
            <div>
              <p className="text-sm text-slate-300">Your Streak</p>
              <h4 className="text-xl font-bold">
                {streak === null ? "—" : `${streak} Days 🔥`}
              </h4>
            </div>
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute -bottom-10 right-0 z-20 rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-2xl md:-bottom-8"
        >
          <div className="flex items-center gap-3">
            <Brain className="text-cyan-400" />
            <div>
              <p className="text-sm text-slate-300">AI Assistant</p>
              <h4 className="font-bold">24 Doubts Solved</h4>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
