import { motion } from "framer-motion";
import {
  GraduationCap,
  Calendar,
  Users,
  Bot,
  Trophy,
  MessageCircle,
} from "lucide-react";

const features = [
  {
    icon: GraduationCap,
    title: "Senior Mentorship",
    description: "Learn directly from experienced seniors.",
  },
  {
    icon: Calendar,
    title: "Live Sessions",
    description: "Interactive coding and career guidance sessions.",
  },
  {
    icon: Users,
    title: "Peer Collaboration",
    description: "Build projects and study together.",
  },
  {
    icon: Bot,
    title: "AI Learning Assistant",
    description: "Instant doubt solving and roadmap generation.",
  },
  {
    icon: Trophy,
    title: "XP & Leaderboards",
    description: "Stay motivated with rankings and rewards.",
  },
  {
    icon: MessageCircle,
    title: "Study Communities",
    description: "Join AIML, DSA, Web Dev and more.",
  },
];

const stats = [
  { value: "15K+", label: "Students Learning" },
  { value: "8K+", label: "Sessions Hosted" },
  { value: "3K+", label: "Mentors Active" },
  { value: "25K+", label: "Doubts Solved" },
];

export function Features() {
  return (
    <>
      {/* Stats */}
      <section id="stats" className="container mx-auto mt-20 grid grid-cols-2 gap-6 px-6 py-10 text-center md:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
            viewport={{ once: true }}
            whileHover={{ y: -8 }}
            className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-2xl transition-all duration-300 hover:border-cyan-400/30 hover:shadow-[0_0_50px_rgba(34,211,238,0.2)]"
          >
            <h3 className="text-4xl font-black">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                {s.value.replace("+", "")}
              </span>
              <span className="text-cyan-400">+</span>
            </h3>

            <p className="mt-3 text-slate-300/70">{s.label}</p>
          </motion.div>
        ))}
      </section>

      {/* How it Works */}
      <section className="container px-6 py-24 relative">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-3xl sm:text-4xl md:text-5xl font-black tracking-tight"
        >
          How
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            {" "}
            PeerLearn
          </span>
          Works
        </motion.h2>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {[
            {
              title: "Create Your Profile",
              desc: "Add your skills, interests, and learning goals.",
            },
            {
              title: "Find Peers & Seniors",
              desc: "Connect with mentors and classmates instantly.",
            },
            {
              title: "Learn & Grow Together",
              desc: "Attend sessions, solve doubts, and earn XP.",
            },
          ].map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
              className="rounded-[30px] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl"
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-2xl font-black text-black">
                {i + 1}
              </div>

              <h3 className="text-2xl font-bold">{step.title}</h3>
              <p className="mt-4 leading-7 text-slate-300/70">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container px-6 py-24">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center text-5xl font-black"
        >
          Powerful Features
        </motion.h2>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => {
            const Icon = f.icon;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -12 }}
                className="group rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl transition-all duration-300 hover:border-cyan-400/40 hover:bg-cyan-500/5 hover:shadow-[0_0_60px_rgba(34,211,238,0.18)]"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black group-hover:scale-110 transition-transform duration-300">
                  <Icon className="h-6 w-6" />
                </div>

                <h3 className="text-2xl font-bold">{f.title}</h3>

                <p className="mt-4 leading-7 text-slate-300/70">
                  {f.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Learners & Mentors */}
      <section className="container grid gap-8 px-6 py-24 lg:grid-cols-2">
        {[
          {
            title: "For Learners 👨‍🎓",
            items: [
              "Join live sessions",
              "Ask doubts instantly",
              "Build projects",
              "Track learning progress",
              "Earn XP and badges",
            ],
          },
          {
            title: "For Mentors 👨‍🏫",
            items: [
              "Conduct mentorship sessions",
              "Guide juniors",
              "Grow your reputation",
              "Earn mentor badges",
              "Build your student community",
            ],
          },
        ].map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.2 }}
            viewport={{ once: true }}
            whileHover={{ y: -10 }}
            className="rounded-[32px] border border-white/10 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 p-10 backdrop-blur-2xl"
          >
            <h3 className="text-4xl font-black">{card.title}</h3>

            <div className="mt-8 space-y-5">
              {card.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 text-slate-300"
                >
                  <div className="h-2 w-2 rounded-full bg-cyan-400" />
                  {item}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </section>
    </>
  );
}
