import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useScroll } from "framer-motion";

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
  ChevronLeft,
  ChevronRight,
  BrainCircuit,
  Code2,
  Globe,
  Rocket,
  Briefcase,
  Activity,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
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
  {
    q: "Can I join more than one community?",
    a: "Yes, you can explore and participate in multiple communities based on your interests.",
  },
  {
    q: "Do I need to be an expert to become a mentor?",
    a: "No, mentors can also guide juniors by sharing project experience, study habits, and career advice.",
  },
  {
    q: "Will my progress and streak be saved?",
    a: "Yes, your streak and learning activity are tracked locally so you can stay motivated day by day.",
  },
];

export default function Landing() {
  const { scrollYProgress } = useScroll();
  const { setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const [open, setOpen] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [streak, setStreak] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const testimonialAutoScrollRef = useRef<number | null>(null);
  const testimonialPausedRef = useRef(false);

  const [review, setReview] = useState("");
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1800);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || loading) {
      return;
    }

    if (testimonialAutoScrollRef.current) {
      cancelAnimationFrame(testimonialAutoScrollRef.current);
      testimonialAutoScrollRef.current = null;
    }

    let animationFrameId: number;

    const scrollLoop = () => {
      if (!testimonialPausedRef.current) {
        const loopPoint = el.scrollWidth / 2;
        if (loopPoint > 0) {
          el.scrollLeft += 2; // Smooth 60fps scrolling
          if (el.scrollLeft >= loopPoint) {
            el.scrollLeft -= loopPoint;
          }
        }
      }
      animationFrameId = requestAnimationFrame(scrollLoop);
      testimonialAutoScrollRef.current = animationFrameId;
    };

    animationFrameId = requestAnimationFrame(scrollLoop);
    testimonialAutoScrollRef.current = animationFrameId;

    return () => {
      cancelAnimationFrame(animationFrameId);
      testimonialAutoScrollRef.current = null;
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
      const prevStreak =
        parseInt(localStorage.getItem(KEY_STREAK) || "0", 10) || 0;

      if (last === todayKey) {
        // same day, keep streak
        setStreak(prevStreak > 0 ? prevStreak : 1);
      } else if (last) {
        const lastDate = new Date(last);
        const diffMs =
          today.setHours(0, 0, 0, 0) - lastDate.setHours(0, 0, 0, 0);
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
                <h4 className="text-xl font-bold">
                  {streak === null ? "—" : `${streak} Days 🔥`}
                </h4>
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
          {/* Icon container */}
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

      {/* Communities */}
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

        {/* Scroll Buttons */}
        <button
          aria-label="Scroll testimonials left"
          onClick={() => {
            const el = scrollRef.current;

            if (el)
              el.scrollBy({
                left: -el.clientWidth * 0.7,
                behavior: "smooth",
              });
          }}
          className="absolute left-2 top-[38%] z-20 -translate-y-1/2 rounded-full border border-white/20 bg-black/40 p-2 text-slate-100 shadow-lg backdrop-blur hover:bg-black/60"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          aria-label="Scroll testimonials right"
          onClick={() => {
            const el = scrollRef.current;

            if (el)
              el.scrollBy({
                left: el.clientWidth * 0.7,
                behavior: "smooth",
              });
          }}
          className="absolute right-2 top-[38%] z-20 -translate-y-1/2 rounded-full border border-white/20 bg-black/40 p-2 text-slate-100 shadow-lg backdrop-blur hover:bg-black/60"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Testimonials Carousel */}
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

            // duplicate for infinite loop
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
          ].map((t, i) => (
            <motion.div
              key={`${t.name}-${i}`}
              whileHover={{ y: -10 }}
              className="min-w-[20rem] md:min-w-[24rem] flex-shrink-0"
            >
              <div className="rounded-3xl bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-indigo-500/12 p-[1px]">
                <motion.div
                  className="rounded-3xl border border-white/12 bg-[#061224]/70 p-8 backdrop-blur-xl shadow-[0_12px_40px_rgba(34,211,238,0.06)]"
                  whileHover={{ y: -6 }}
                >
                  <div className="mb-4 flex items-center gap-2">
                    <span
                      aria-hidden
                      className="text-base tracking-wide text-yellow-400"
                    >
                      {"★".repeat(t.rating)}
                      {"☆".repeat(5 - t.rating)}
                    </span>

                    <span className="text-sm text-slate-300">{t.rating}/5</span>
                  </div>

                  <p className="flex items-start gap-3 text-lg leading-9 text-slate-100/95">
                    <span className="text-3xl leading-none text-cyan-400/90">
                      “
                    </span>

                    <span>{t.text}</span>
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

        {/* Review Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative mt-24 overflow-hidden rounded-[36px] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl md:p-12"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_60%)]" />

          <div className="relative z-10">
            <div className="mb-10 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-5 py-2 text-sm text-cyan-300 backdrop-blur-xl">
                <Sparkles size={16} />
                Community Feedback
              </div>

              <h3 className="text-4xl font-black md:text-5xl">
                Share Your
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500 bg-clip-text text-transparent">
                  {" "}
                  Experience
                </span>
              </h3>

              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-300/70 md:text-lg">
                Help us improve PeerLearn by sharing your feedback and learning
                experience.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();

                if (!review.trim()) {
                  alert("Please enter your feedback.");
                  return;
                }

                setSubmitted(true);

                setTimeout(() => {
                  setSubmitted(false);
                }, 3000);

                setName("");
                setRating(0);
                setReview("");
              }}
              className="space-y-7"
            >
              {/* Name */}
              <div>
                <label className="mb-3 block text-sm font-semibold text-slate-300">
                  Your Name (Optional)
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white outline-none backdrop-blur-xl transition-all duration-300 placeholder:text-slate-500 focus:border-cyan-400/40 focus:bg-white/10"
                />
              </div>

              {/* Rating */}
              <div>
                <label className="mb-3 block text-sm font-semibold text-slate-300">
                  Rating (Optional)
                </label>

                <div className="flex gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.95 }}
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-4xl transition-all duration-300 ${
  rating >= star
    ? "text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.6)]"
    : "text-slate-500 hover:text-yellow-300"
}`}
                    >
                      ★
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Feedback */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="block text-sm font-semibold text-slate-300">
                    Your Feedback
                  </label>

                  <span className="text-xs text-slate-500">
                    {review.length}/500
                  </span>
                </div>

                <textarea
                  rows={6}
                  maxLength={500}
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Write your review or suggestions..."
                  className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white outline-none backdrop-blur-xl transition-all duration-300 placeholder:text-slate-500 focus:border-cyan-400/40 focus:bg-white/10"
                />
              </div>

              {/* Submit */}
              <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center">
                <Button
                  type="submit"
                  className="rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-8 py-7 text-base font-bold text-black shadow-[0_0_35px_rgba(34,211,238,0.35)] transition-all duration-300 hover:scale-105"
                >
                  Submit Feedback
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                {submitted && (
                  <motion.div
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300"
                  >
                    ✅ Thank you! Your feedback has been submitted.
                  </motion.div>
                )}
              </div>
            </form>
          </div>
        </motion.div>

        <style>{`
          .no-scrollbar::-webkit-scrollbar {
          display: none;}

        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;}
  `     }
        </style>
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
      <section id="faq" className="container relative mx-auto max-w-6xl px-6 py-24">
        <div className="pointer-events-none absolute inset-x-6 top-12 -z-10 h-40 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute right-10 top-28 -z-10 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="pointer-events-none absolute left-16 bottom-24 -z-10 h-36 w-36 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="mx-auto max-w-5xl">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-4 flex items-center justify-center gap-3 text-center text-4xl font-black tracking-tight text-white sm:text-5xl"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.12)] sm:h-12 sm:w-12">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
            </span>
            Frequently Asked Questions
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="mx-auto mb-14 max-w-2xl text-center text-sm leading-7 text-slate-300/80 sm:text-base"
          >
            Find quick answers about mentoring, sessions, communities, and how
            to get started on PeerLearn.
          </motion.p>

          <div className="grid gap-5 md:grid-cols-2 md:items-start">
            {faqs.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="group relative self-start overflow-hidden rounded-3xl border border-white/12 bg-white/7 shadow-[0_12px_40px_rgba(2,6,23,0.28)] backdrop-blur-3xl transition-all duration-300 hover:border-cyan-400/25 hover:shadow-[0_18px_70px_rgba(34,211,238,0.12)]"
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-cyan-400/5 opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-cyan-300/20 via-transparent to-transparent" />

                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className={`group flex w-full items-center justify-between px-6 py-5 text-left transition-all duration-300 sm:px-7 ${
                    open === i
                      ? "bg-cyan-400/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                      : "text-slate-100 hover:bg-white/6"
                  }`}
                >
                  <span className="pr-4 text-base font-semibold leading-7 tracking-tight text-white sm:text-lg">
                    {item.q}
                  </span>
                  <motion.span
                    animate={{ rotate: open === i ? 180 : 0, scale: open === i ? 1.08 : 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                      open === i
                        ? "border-cyan-400/40 bg-cyan-400/15 text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.24)]"
                        : "border-white/10 bg-white/5 text-slate-300 group-hover:border-cyan-400/25 group-hover:text-cyan-200"
                    }`}
                  >
                    <ChevronDown className="h-5 w-5" />
                  </motion.span>
                </button>

                <motion.div
                  initial={false}
                  animate={{
                    height: open === i ? "auto" : 0,
                    opacity: open === i ? 1 : 0,
                  }}
                  transition={{ duration: 0.32, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-white/10 px-6 pb-6 pt-4 sm:px-7">
                    <p className="max-w-3xl text-sm leading-7 text-slate-200/90 sm:text-base">
                      {item.a}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
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

          <div className="flex flex-wrap gap-8 text-slate-300">
            <a href="#features" className="transition hover:text-cyan-400">
              Features
            </a>

            <a href="#community" className="transition hover:text-cyan-400">
              Communities
            </a>

            <a href="#faq" className="transition hover:text-cyan-400">
              FAQ
            </a>

            <Link to="/contact" className="transition hover:text-cyan-400">
              Contact Us
            </Link>

            <Link
              to="/privacy-policy"
              className="transition hover:text-cyan-400"
            >
              Privacy Policy
            </Link>
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
