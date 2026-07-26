import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/useAuth";

interface Testimonial {
  text: string;
  name: string;
  role: string;
  rating: number;
  avatar: string;
  verified: boolean;
  skills: string[];
  outcome: string;
}

// Deterministic placeholder avatar for user-submitted testimonials
// (we don't collect a role/avatar/skills/outcome on the submission form).
function avatarForUser(userId: string) {
  const seed = Math.abs(
    Array.from(userId).reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  ) % 70;
  return `https://i.pravatar.cc/150?img=${seed}`;
}

function mapDbRowToTestimonial(row: {
  id: string;
  user_id: string;
  name: string | null;
  rating: number | null;
  review: string;
}): Testimonial {
  return {
    text: row.review,
    name: row.name?.trim() || "PeerLearn Learner",
    role: "Community Member",
    rating: row.rating ?? 5,
    avatar: avatarForUser(row.user_id),
    verified: true,
    skills: [],
    outcome: "Shared their experience",
  };
}

export function Testimonials() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const testimonialAutoScrollRef = useRef<number | null>(null);
  const testimonialPausedRef = useRef(false);
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [liveTestimonials, setLiveTestimonials] = useState<Testimonial[]>([]);

  // Seeded fallback content — always shown so the carousel never looks empty
  // while real submissions are still trickling in.
  const seedTestimonials: Testimonial[] = [
    {
      text: "PeerLearn helped me crack my first internship interview.",
      name: "Aisha Khan",
      role: "AIML Student",
      rating: 5,
      avatar: "https://i.pravatar.cc/150?img=32",
      verified: true,
      skills: ["Machine Learning", "Python", "DSA"],
      outcome: "Secured Internship at Google",
    },
    {
      text: "I started mentoring juniors and improved my communication skills.",
      name: "Rahul Sharma",
      role: "Senior Mentor",
      rating: 5,
      avatar: "https://i.pravatar.cc/150?img=64",
      verified: true,
      skills: ["Mentoring", "System Design", "Leadership"],
      outcome: "Became a Top-Rated Mentor",
    },
    {
      text: "Found amazing teammates for hackathons and projects.",
      name: "John Patel",
      role: "Web Developer",
      rating: 4,
      avatar: "https://i.pravatar.cc/150?img=45",
      verified: true,
      skills: ["React", "Next.js", "Tailwind"],
      outcome: "Won 2 Hackathons",
    },
    {
      text: "Built a polished project portfolio with mentor guidance.",
      name: "Maya Singh",
      role: "Frontend Developer",
      rating: 5,
      avatar: "https://i.pravatar.cc/150?img=47",
      verified: true,
      skills: ["TypeScript", "Framer Motion", "UI/UX"],
      outcome: "3 Projects Added to Portfolio",
    },
    {
      text: "Mentors gave real-world advice that helped my internship prep.",
      name: "Priya Malhotra",
      role: "ML Intern",
      rating: 5,
      avatar: "https://i.pravatar.cc/150?img=33",
      verified: true,
      skills: ["TensorFlow", "Computer Vision", "Research"],
      outcome: "Improved DSA Rating by 450",
    },
    {
      text: "Great community for interview practice and study groups.",
      name: "Gautam Reddy",
      role: "DSA Enthusiast",
      rating: 4,
      avatar: "https://i.pravatar.cc/150?img=68",
      verified: true,
      skills: ["LeetCode", "Competitive Programming"],
      outcome: "First Open Source Contribution",
    },
  ];

  const fetchTestimonials = useCallback(async () => {
    const { data, error } = await supabase
      .from("testimonials")
      .select("id, user_id, name, rating, review")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      // Non-fatal: the carousel still shows the seed testimonials below.
      console.error("Failed to load testimonials:", error.message);
      return;
    }

    setLiveTestimonials((data ?? []).map(mapDbRowToTestimonial));
  }, []);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  // Real submissions first, seeded content fills out the rest.
  const testimonials = useMemo(
    () => [...liveTestimonials, ...seedTestimonials],
    [liveTestimonials]
  );

  // Duplicate the source list so the carousel can loop seamlessly. The scroll loop relies on this being an exact doubling (it wraps at scrollWidth / 2).
  const carouselItems = [...testimonials, ...testimonials];

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let animationFrameId: number;

    const scrollLoop = () => {
      if (!testimonialPausedRef.current) {
        const loopPoint = el.scrollWidth / 2;
        if (loopPoint > 0) {
          el.scrollLeft += 2;
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
  }, []);

  return (
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
        {carouselItems.map((t, i) => (
          <motion.div
            key={`${t.name}-${i}`}
            whileHover={{ y: -10 }}
            className="min-w-[20rem] md:min-w-[26rem] flex-shrink-0"
          >
            <div className="rounded-3xl bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-indigo-500/12 p-[1px]">
              <motion.div
                className="rounded-3xl border border-white/12 bg-[#061224]/70 p-8 backdrop-blur-xl shadow-[0_12px_40px_rgba(34,211,238,0.06)] h-full flex flex-col"
                whileHover={{ y: -6 }}
              >
                {/* Avatar & Info */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="relative flex-shrink-0">
                    <img
                      src={t.avatar}
                      alt={`${t.name}'s avatar`}
                      className="h-14 w-14 rounded-full border-2 border-white/20 object-cover"
                    />
                    {t.verified && (
                      <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-emerald-500 p-1 ring-2 ring-[#061224]">
                        <CheckCircle className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 pt-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-100 truncate">
                        {t.name}
                      </h4>
                      {t.verified && (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                          <CheckCircle className="h-3 w-3" />
                          VERIFIED
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-300 truncate">{t.role}</p>
                  </div>
                </div>

                {/* Rating */}
                <div className="mb-5 flex items-center gap-2">
                  <span
                    aria-hidden
                    className="text-base tracking-wide text-yellow-400"
                  >
                    {"★".repeat(t.rating)}
                    {"☆".repeat(5 - t.rating)}
                  </span>
                  <span className="text-sm text-slate-300">{t.rating}/5</span>
                </div>

                {/* Learning Outcome */}
                <div className="mb-4 inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 text-sm text-cyan-300">
                  <span className="mr-2">🚀</span>
                  {t.outcome}
                </div>

                {/* Testimonial Text */}
                <p className="flex-1 text-lg leading-9 text-slate-100/95">
                  <span className="text-3xl leading-none text-cyan-400/90">
                    “
                  </span>
                  {t.text}
                </p>

                {/* Skill Tags */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {t.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="rounded-md bg-white/5 px-3 py-1 text-xs text-slate-300 border border-white/10"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <Link to="/reviews">
          <Button
            variant="outline"
            className="group rounded-2xl border-white/15 bg-white/5 px-6 py-6 text-base font-semibold text-slate-100 backdrop-blur-xl transition-all duration-300 hover:border-cyan-400/40 hover:bg-white/10 hover:text-cyan-300"
          >
            View All Reviews
            <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        </Link>
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
            onSubmit={async (e) => {
              e.preventDefault();

              if (!review.trim()) {
                toast.error("Please enter your feedback.");
                return;
              }

              if (!user) {
                toast.error("Please log in to submit a review.");
                return;
              }

              setIsSubmitting(true);

              const { error } = await supabase.from("testimonials").insert({
                user_id: user.id,
                name: name.trim() || null,
                rating: rating || null,
                review: review.trim(),
              });

              setIsSubmitting(false);

              if (error) {
                console.error("Failed to submit testimonial:", error.message);
                toast.error("Something went wrong. Please try again.");
                return;
              }

              setSubmitted(true);
              setTimeout(() => setSubmitted(false), 3000);
              setName("");
              setRating(0);
              setReview("");

              // Pull the new review straight into the carousel.
              fetchTestimonials();
            }}
            className="space-y-7"
          >
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

            <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-8 py-7 text-base font-bold text-black shadow-[0_0_35px_rgba(34,211,238,0.35)] transition-all duration-300 hover:scale-105 disabled:opacity-60 disabled:hover:scale-100"
              >
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              {!user && (
                <p className="text-sm text-slate-400">
                  Please log in to leave a review.
                </p>
              )}

              {submitted && (
                <motion.div
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300"
                >
                   Thank you! Your feedback has been submitted.
                </motion.div>
              )}
            </div>
          </form>
        </div>
      </motion.div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}