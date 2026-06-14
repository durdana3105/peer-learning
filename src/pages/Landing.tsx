import { motion, useScroll } from "framer-motion";
import { ChevronDown, Sparkles, Linkedin, Github, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { useCookieConsent } from "@/contexts/CookieConsentContext";
import { useState, useEffect } from "react";

import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Communities } from "@/components/landing/Communities";
import { Testimonials } from "@/components/landing/Testimonials";

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
  const { openPreferences, preferences } = useCookieConsent();

  const [open, setOpen] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1800);
    return () => clearTimeout(timer);
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

    if (!preferences?.functional) {
      try {
        localStorage.removeItem(KEY_STREAK);
        localStorage.removeItem(KEY_LAST);
      } catch {
        // ignore storage access failures
      }
      setStreak(null);
      return;
    }

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
  }, [preferences?.functional]);

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

      <Hero streak={streak} />

      <Features />

      <Communities />

      <Testimonials />

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
      <section
        id="faq"
        className="container relative mx-auto max-w-6xl px-6 py-24"
      >
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
                    animate={{
                      rotate: open === i ? 180 : 0,
                      scale: open === i ? 1.08 : 1,
                    }}
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

            <Link
              to="/cookies-policy"
              className="transition hover:text-cyan-400"
            >
              Cookies Policy
            </Link>

            <button
              type="button"
              onClick={openPreferences}
              className="transition hover:text-cyan-400"
            >
              Cookie Settings
            </button>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://github.com/durdana3105"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              title="GitHub"
              className="text-slate-400 transition-all duration-300 hover:scale-110 hover:text-cyan-400"
            >
              <Github className="h-5 w-5" />
            </a>

            <a
              href="https://www.linkedin.com/in/durdana-sultana-499464294"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              title="LinkedIn"
              className="text-slate-400 transition-all duration-300 hover:scale-110 hover:text-cyan-400"
            >
              <Linkedin className="h-5 w-5" />
            </a>

            <a
              href="mailto:durdanasultana06@gmail.com"
              aria-label="Email"
              title="Email"
              className="text-slate-400 transition-all duration-300 hover:scale-110 hover:text-cyan-400"
            >
              <Mail className="h-5 w-5" />
            </a>
          </div>

          <div className="text-slate-500">© 2026 PeerLearn</div>
        </div>
      </footer>
    </motion.div>
  );
}
