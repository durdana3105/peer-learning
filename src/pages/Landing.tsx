import { motion, useScroll } from "framer-motion";
import {
  ArrowRight,
  Users,
  Calendar,
  MessageCircle,
  Trophy,
  Sparkles,
  ChevronDown,
  Brain,
  GraduationCap,
  Bot,
  Flame,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import heroIllustration from "@/assets/hero-illustration.png";

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

const faqs = [
  {
    q: "Can I be both a learner and mentor?",
    a: "Yes! You can switch between learner and mentor mode anytime.",
  },
  {
    q: "Are live sessions free?",
    a: "Most community sessions are completely free.",
  },
  {
    q: "How do mentors get verified?",
    a: "Mentors can verify through college email, LinkedIn, or GitHub.",
  },
];

export default function Landing() {
  const { scrollYProgress } = useScroll();

  const [open, setOpen] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1800);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center overflow-hidden bg-[#020617]">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.15, opacity: 1 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-6xl font-black tracking-wider text-transparent"
        >
          PeerLearn
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-[#020617] via-[#071127] to-[#020B1F] text-white"
    >
      {/* Animated Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <motion.div
        animate={{
          x: [0, 40, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
        }}
        className="absolute left-10 top-20 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl"
      />

      <motion.div
        animate={{
          x: [0, -30, 0],
          y: [0, 40, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
        }}
        className="absolute right-10 top-40 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl"
      />

      {/* Floating Particles */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-2 w-2 rounded-full bg-cyan-400 opacity-20"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -40, 0],
          }}
          transition={{
            duration: 5 + i,
            repeat: Infinity,
          }}
        />
      ))}

      {/* Navbar */}
      <nav className="fixed top-0 z-[1000] w-full border-b border-cyan-400/10 bg-[#020617]/95 backdrop-blur-3xl shadow-[0_0_20px_rgba(34,211,238,0.08)]">
        {" "}
        <div className="container mx-auto flex items-center justify-between px-6 py-5">
          <div className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-2xl font-black text-transparent">
            PeerLearn
          </div>

          <div className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a href="#features" className="transition hover:text-cyan-400">
              Features
            </a>
            <a href="#community" className="transition hover:text-cyan-400">
              Communities
            </a>
            <a
              href="/contributor-dashboard"
              className="transition hover:text-cyan-400"
            >
              Contributor Dashboard
            </a>
            <a href="#faq" className="transition hover:text-cyan-400">
              FAQ
            </a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button
                variant="ghost"
                className="text-slate-300 hover:text-cyan-400"
              >
                Login
              </Button>
            </Link>

            <Link to="/signup">
              <Button className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black hover:scale-105 transition-all duration-300">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}

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
            className="absolute -left-8 top-10 rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-2xl"
          >
            <div className="flex items-center gap-3">
              <Flame className="text-cyan-400" />
              <div>
                <p className="text-sm text-slate-300">Your Streak</p>
                <h4 className="text-xl font-bold">5 Days 🔥</h4>
              </div>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute bottom-10 right-0 rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-2xl"
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

      {/* Stats */}
      <section className="container mx-auto mt-20 grid grid-cols-2 gap-6 px-6 py-10 text-center md:grid-cols-4">
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
      <section className="container px-6 py-24">
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
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -12 }}
              className="group rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl transition-all duration-300 hover:border-cyan-400/40 hover:bg-cyan-500/5 hover:shadow-[0_0_60px_rgba(34,211,238,0.18)]"
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black">
                <f.icon />
              </div>

              <h3 className="text-2xl font-bold">{f.title}</h3>

              <p className="mt-4 leading-7 text-slate-300/70">
                {f.description}
              </p>
            </motion.div>
          ))}
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

      {/* Communities */}
      <section id="community" className="container px-6 py-24">
        <h2 className="mb-16 text-center text-5xl font-black">
          Explore Communities
        </h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          {[
            "AIML Community",
            "DSA Warriors",
            "Web Dev Hub",
            "Hackathon Teams",
            "Interview Prep",
          ].map((community, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05, rotate: 1 }}
              className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl transition-all duration-300 hover:border-cyan-400/30 hover:shadow-[0_0_40px_rgba(34,211,238,0.2)]"
            >
              <h3 className="font-bold text-cyan-300">{community}</h3>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="container px-6 py-24">
        <h2 className="mb-16 text-center text-5xl font-black">
          Loved by Students
        </h2>

        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              text: "PeerLearn helped me crack my first internship interview.",
              name: "Aisha",
              role: "AIML Student",
            },
            {
              text: "I started mentoring juniors and improved my communication skills.",
              name: "Rahul",
              role: "Senior Mentor",
            },
            {
              text: "Found amazing teammates for hackathons and projects.",
              name: "John",
              role: "Web Developer",
            },
          ].map((t, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10 }}
              className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 p-8 backdrop-blur-xl"
            >
              <p className="leading-8 text-slate-300/80">“{t.text}”</p>

              <div className="mt-8">
                <h4 className="font-bold text-cyan-400">{t.name}</h4>
                <p className="text-sm text-slate-400">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container px-6 pb-24">
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="relative overflow-hidden rounded-[40px] border border-white/10 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-14 text-center backdrop-blur-2xl"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.15),transparent_60%)]" />

          <h2 className="relative z-10 text-5xl font-black leading-tight">
            Ready to Learn,
            <br />
            Teach & Grow Together?
          </h2>

          <p className="relative z-10 mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300/70">
            Join thousands of students already learning with PeerLearn.
          </p>

          <div className="relative z-10 mt-10 flex flex-wrap justify-center gap-5">
            <Button className="rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-8 py-7 text-black transition-all duration-300 hover:scale-105">
              Get Started
            </Button>

            <Link to="/become-mentor">
              <Button
                variant="outline"
                className="rounded-2xl border border-cyan-400/40 bg-white/5 px-8 py-7 text-base font-semibold text-cyan-300 backdrop-blur-xl transition-all duration-300 hover:bg-cyan-400/10 hover:scale-105"
              >
                Become a Mentor
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container mx-auto max-w-4xl px-6 py-24">
        <h2 className="mb-12 text-center text-5xl font-black">
          Frequently Asked Questions
        </h2>

        {faqs.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-5 overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl"
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between px-6 py-5 text-left"
            >
              <span className="text-lg font-semibold">{item.q}</span>
              <ChevronDown />
            </button>

            {open === i && (
              <div className="px-6 pb-6 text-slate-300/70">{item.a}</div>
            )}
          </motion.div>
        ))}
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#020617]/70 px-6 py-12 backdrop-blur-2xl">
        <div className="container flex flex-col items-center justify-between gap-8 md:flex-row">
          <div>
            <h3 className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-3xl font-black text-transparent">
              PeerLearn
            </h3>
            <p className="mt-3 text-slate-400">
              Built for collaborative student learning.
            </p>
          </div>

          <div className="flex gap-8 text-slate-300">
            <a href="#" className="transition hover:text-cyan-400">
              Features
            </a>
            <a href="#" className="transition hover:text-cyan-400">
              Communities
            </a>
            <a href="#" className="transition hover:text-cyan-400">
              FAQ
            </a>
          </div>

          <div className="text-slate-500">© 2026 PeerLearn</div>
        </div>
      </footer>
    </motion.div>
  );
}
