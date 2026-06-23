import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

const TESTIMONIALS = [
  { text: "PeerLearn helped me crack my first internship interview.", name: "Aisha", role: "AIML Student", rating: 5 },
  { text: "I started mentoring juniors and improved my communication skills.", name: "Rahul", role: "Senior Mentor", rating: 5 },
  { text: "Found amazing teammates for hackathons and projects.", name: "John", role: "Web Developer", rating: 4 },
  { text: "Built a polished project portfolio with mentor guidance.", name: "Maya", role: "Frontend Developer", rating: 5 },
  { text: "Mentors gave real-world advice that helped my internship prep.", name: "Priya", role: "ML Intern", rating: 5 },
  { text: "Great community for interview practice and study groups.", name: "Gautam", role: "DSA Enthusiast", rating: 4 },
];

export function Testimonials() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const testimonialAutoScrollRef = useRef<number | null>(null);
  const testimonialPausedRef = useRef(false);

  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

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
        {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
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
                    "
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
                toast.error("Please enter your feedback.");
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
  );
}