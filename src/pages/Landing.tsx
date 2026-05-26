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
  Moon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { useState, useEffect, useRef } from "react";
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
  const { setTheme } = useTheme();

  const [open, setOpen] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [streak, setStreak] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const testimonialAutoScrollRef = useRef<number | null>(null);
  const testimonialPausedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1800);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || loading) {
      return;
    }

    // clear any existing interval before creating a new one
    if (testimonialAutoScrollRef.current) {
      clearInterval(testimonialAutoScrollRef.current);
      testimonialAutoScrollRef.current = null;
    }

    testimonialAutoScrollRef.current = window.setInterval(() => {
      if (testimonialPausedRef.current) {
        return;
      }

      // Cards are duplicated, so loop back at halfway for a seamless carousel.
      const loopPoint = el.scrollWidth / 2;
      if (loopPoint <= 0) {
        return;
      }

      el.scrollLeft += 3; // slightly faster
      if (el.scrollLeft >= loopPoint) {
        el.scrollLeft -= loopPoint;
      }
    }, 16);

    return () => {
      if (testimonialAutoScrollRef.current) {
        clearInterval(testimonialAutoScrollRef.current);
        testimonialAutoScrollRef.current = null;
      }
    };
  }, [loading]);

  useEffect(() => {
  const handleScroll = () => {
    setShowBackToTop(window.scrollY > 300);
  };

  window.addEventListener("scroll", handleScroll);

  return () => window.removeEventListener("scroll", handleScroll);
}, []);

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};


  useEffect(() => {
    // Device-local daily streak using localStorage
    const KEY_STREAK = "pl_streak";
    const KEY_LAST = "pl_last_active";

    const today = new Date();
    const todayKey = today.toISOString().slice(0, 10); // YYYY-MM-DD

    try {
      const last = localStorage.getItem(KEY_LAST);
      const prevStreak = parseInt(localStorage.getItem(KEY_STREAK) || "0", 10) || 0;

      if (last === todayKey) {
        // same day, keep streak
        setStreak(prevStreak > 0 ? prevStreak : 1);
      } else if (last) {
        const lastDate = new Date(last);
        const diffMs = today.setHours(0, 0, 0, 0) - lastDate.setHours(0, 0, 0, 0);
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          const newStreak = prevStreak + 1 || 1;
          localStorage.setItem(KEY_STREAK, String(newStreak));
          localStorage.setItem(KEY_LAST, todayKey);
          setStreak(newStreak);
        } else {
          // gap > 1 day, reset
          localStorage.setItem(KEY_STREAK, "1");
          localStorage.setItem(KEY_LAST, todayKey);
          setStreak(1);
        }
      } else {
        // first time
        localStorage.setItem(KEY_STREAK, "1");
        localStorage.setItem(KEY_LAST, todayKey);
        setStreak(1);
      }
    } catch (e) {
      setStreak(0);
    }
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
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl text-slate-300 hover:text-cyan-400"
                title="Theme: Dark (Default)"
              >
                <Moon className="h-5 w-5 text-cyan-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="z-[1001] bg-[#0b1329] border-white/10 text-white min-w-[12rem]">
              <DropdownMenuLabel className="text-gray-400 font-semibold text-xs px-2 py-1">Select Theme</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer focus:bg-white/10 hover:bg-white/10 focus:text-white px-3 py-2 text-sm rounded-lg" onClick={() => setTheme("default")}>
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                <span className="text-cyan-400 font-medium">Default</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer focus:bg-white/10 hover:bg-white/10 focus:text-white px-3 py-2 text-sm rounded-lg" onClick={() => setTheme("purple")}>
                <span className="h-2 w-2 rounded-full bg-purple-500" />
                <span className="text-purple-400 font-medium">Purple Galaxy</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer focus:bg-white/10 hover:bg-white/10 focus:text-white px-3 py-2 text-sm rounded-lg" onClick={() => setTheme("blue")}>
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-blue-400 font-medium">Ocean Blue</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer focus:bg-white/10 hover:bg-white/10 focus:text-white px-3 py-2 text-sm rounded-lg" onClick={() => setTheme("green")}>
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-green-400 font-medium">Neon Green</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer focus:bg-white/10 hover:bg-white/10 focus:text-white px-3 py-2 text-sm rounded-lg" onClick={() => setTheme("orange")}>
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                <span className="text-orange-400 font-medium">Sunset Orange</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
      {/* <section className="container relative grid items-center gap-16 px-6 pb-24 pt-24 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        > */}

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
                  <h4 className="text-xl font-bold">{streak === null ? "—" : `${streak} Days 🔥`}</h4>
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
      <section className="container relative px-6 py-24">
        <h2 className="mb-16 flex flex-wrap items-center justify-center gap-3 text-center text-5xl font-black leading-none sm:text-6xl">
          <span className="text-slate-700">Learners</span>
          <span role="img" aria-label="heart" className="text-5xl sm:text-6xl">
            ❤️
          </span>
          <span className="bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">
            Peer Learning
          </span>
        </h2>

        <button
          aria-label="Scroll testimonials left"
          onClick={() => {
            const el = scrollRef.current;
            if (el) el.scrollBy({ left: -el.clientWidth * 0.7, behavior: "smooth" });
          }}
          className="absolute left-2 top-[60%] z-20 -translate-y-1/2 rounded-full border border-white/20 bg-black/40 p-2 text-slate-100 shadow-lg backdrop-blur hover:bg-black/60"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          aria-label="Scroll testimonials right"
          onClick={() => {
            const el = scrollRef.current;
            if (el) el.scrollBy({ left: el.clientWidth * 0.7, behavior: "smooth" });
          }}
          className="absolute right-2 top-[60%] z-20 -translate-y-1/2 rounded-full border border-white/20 bg-black/40 p-2 text-slate-100 shadow-lg backdrop-blur hover:bg-black/60"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div
          ref={scrollRef}
          onMouseEnter={() => {
            testimonialPausedRef.current = true;
          }}
          onMouseLeave={() => {
            testimonialPausedRef.current = false;
          }}
          className="no-scrollbar flex gap-8 overflow-x-auto py-2 md:py-0"
          style={{ scrollBehavior: "smooth" }}
        >
          {[
            {
              text: "PeerLearn helped me crack my first internship interview.",
              name: "Aisha",
              role: "AIML Student",
              rating: 5,
            },
            {
              text: "I started mentoring juniors and improved my communication skills.",
              name: "Rahul",
              role: "Senior Mentor",
              rating: 5,
            },
            {
              text: "Found amazing teammates for hackathons and projects.",
              name: "John",
              role: "Web Developer",
              rating: 4,
            },
            {
              text: "Built a polished project portfolio with mentor guidance.",
              name: "Maya",
              role: "Frontend Developer",
              rating: 5,
            },
            {
              text: "Mentors gave real-world advice that helped my internship prep.",
              name: "Priya",
              role: "ML Intern",
              rating: 5,
            },
            {
              text: "Great community for interview practice and study groups.",
              name: "Gautam",
              role: "DSA Enthusiast",
              rating: 4,
            },
            // duplicate for seamless looping
            {
              text: "PeerLearn helped me crack my first internship interview.",
              name: "Aisha",
              role: "AIML Student",
              rating: 5,
            },
            {
              text: "I started mentoring juniors and improved my communication skills.",
              name: "Rahul",
              role: "Senior Mentor",
              rating: 5,
            },
            {
              text: "Found amazing teammates for hackathons and projects.",
              name: "John",
              role: "Web Developer",
              rating: 4,
            },
            {
              text: "Built a polished project portfolio with mentor guidance.",
              name: "Maya",
              role: "Frontend Developer",
              rating: 5,
            },
            {
              text: "Mentors gave real-world advice that helped my internship prep.",
              name: "Priya",
              role: "ML Intern",
              rating: 5,
            },
            {
              text: "Great community for interview practice and study groups.",
              name: "Gautam",
              role: "DSA Enthusiast",
              rating: 4,
            },
          ].map((t, i) => (
            <motion.div
              key={`${t.name}-${i}`}
              whileHover={{ y: -10 }}
              className="min-w-[20rem] md:min-w-[24rem] flex-shrink-0"
            >
              <div className="rounded-3xl p-[1px] bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-indigo-500/12">
                <motion.div
                  className="rounded-3xl border border-white/12 bg-[#061224]/70 p-8 backdrop-blur-xl shadow-[0_12px_40px_rgba(34,211,238,0.06)]"
                  whileHover={{ y: -6 }}
                >
                  <div className="mb-4 flex items-center gap-2">
                    <span aria-hidden className="text-base tracking-wide text-yellow-400">{"★".repeat(t.rating)}{"☆".repeat(5 - t.rating)}</span>
                    <span className="text-sm text-slate-300">{t.rating}/5</span>
                  </div>
                  <p className="flex items-start gap-3 leading-9 text-slate-100/95 text-lg">
                    <span className="text-3xl text-cyan-400/90 leading-none">“</span>
                    <span className="text-slate-100/95">{t.text}</span>
                  </p>

                  <div className="mt-6">
                    <h4 className="font-bold text-slate-100">{t.name}</h4>
                    <p className="text-sm text-slate-300">{t.role}</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
        <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
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
            <a href="#features" className="transition hover:text-cyan-400">
              Features
            </a>
            <a href="#community" className="transition hover:text-cyan-400">
              Communities
            </a>
            <a href="#faq" className="transition hover:text-cyan-400">
              FAQ
            </a>
          </div>

          <div className="text-slate-500">© 2026 PeerLearn</div>
        </div>
      </footer>
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-24 z-50 rounded-full bg-cyan-500 px-4 py-3 text-black shadow-lg transition hover:bg-cyan-400"
          aria-label="Back to top"
        >
        ↑
        </button>
      )}
    </motion.div>
  );
}
