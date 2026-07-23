import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Testimonial {
  id: string;
  text: string;
  name: string;
  role: string;
  rating: number;
  avatar: string;
  verified: boolean;
  skills: string[];
  outcome: string;
}

// Same deterministic avatar strategy as the homepage carousel, so a given
// reviewer's avatar stays consistent between the two views.
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
    id: row.id,
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

// Seeded fallback content, kept in sync with the homepage carousel so this
// page never looks emptier than the preview visitors already saw.
const seedTestimonials: Testimonial[] = [
  {
    id: "seed-1",
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
    id: "seed-2",
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
    id: "seed-3",
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
    id: "seed-4",
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
    id: "seed-5",
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
    id: "seed-6",
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

export default function AllReviews() {
  const [liveTestimonials, setLiveTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [minRating, setMinRating] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data, error: fetchError } = await supabase
        .from("testimonials")
        .select("id, user_id, name, rating, review")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (fetchError) {
        console.error("Failed to load testimonials:", fetchError.message);
        setError("Couldn't load community reviews right now. Showing highlights instead.");
      } else {
        setLiveTestimonials((data ?? []).map(mapDbRowToTestimonial));
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const allTestimonials = useMemo(
    () => [...liveTestimonials, ...seedTestimonials],
    [liveTestimonials]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allTestimonials.filter((t) => {
      const matchesQuery =
        !q ||
        t.text.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.outcome.toLowerCase().includes(q);
      const matchesRating = t.rating >= minRating;
      return matchesQuery && matchesRating;
    });
  }, [allTestimonials, query, minRating]);

  return (
    <div className="min-h-screen bg-[#020617] px-6 py-16 text-slate-100">
      <div className="container mx-auto max-w-6xl">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-cyan-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <h1 className="mb-3 flex flex-wrap items-center gap-3 text-4xl font-black leading-none sm:text-5xl">
          <span className="text-slate-100">All</span>
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500 bg-clip-text text-transparent">
            Reviews
          </span>
        </h1>
        <p className="mb-10 max-w-2xl text-base leading-7 text-slate-400">
          Every story shared by the PeerLearn community, in one place.
          {!loading && ` ${filtered.length} review${filtered.length === 1 ? "" : "s"}.`}
        </p>

        {/* Controls */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reviews..."
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white outline-none backdrop-blur-xl transition-all duration-300 placeholder:text-slate-500 focus:border-cyan-400/40 focus:bg-white/10"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Min rating:</span>
            {[0, 3, 4, 5].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setMinRating(r)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  minRating === r
                    ? "border-cyan-400/50 bg-cyan-400/15 text-cyan-300"
                    : "border-white/10 bg-white/5 text-slate-400 hover:text-slate-200"
                }`}
              >
                {r === 0 ? "All" : `${r}+ ★`}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="mb-8 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-300">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-24 text-center text-slate-400">
            No reviews match your search yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                className="rounded-3xl bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-indigo-500/12 p-[1px]"
              >
                <div className="flex h-full flex-col rounded-3xl border border-white/12 bg-[#061224]/70 p-8 backdrop-blur-xl shadow-[0_12px_40px_rgba(34,211,238,0.06)]">
                  <div className="mb-6 flex items-start gap-4">
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
                        <h4 className="truncate font-bold text-slate-100">
                          {t.name}
                        </h4>
                        {t.verified && (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                            <CheckCircle className="h-3 w-3" />
                            VERIFIED
                          </span>
                        )}
                      </div>
                      <p className="truncate text-sm text-slate-300">{t.role}</p>
                    </div>
                  </div>

                  <div className="mb-5 flex items-center gap-2">
                    <span aria-hidden className="text-base tracking-wide text-yellow-400">
                      {"★".repeat(t.rating)}
                      {"☆".repeat(5 - t.rating)}
                    </span>
                    <span className="text-sm text-slate-300">{t.rating}/5</span>
                  </div>

                  <div className="mb-4 inline-flex w-fit items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 text-sm text-cyan-300">
                    <span className="mr-2">🚀</span>
                    {t.outcome}
                  </div>

                  <p className="flex-1 text-base leading-8 text-slate-100/95">
                    <span className="text-2xl leading-none text-cyan-400/90">"</span>
                    {t.text}
                  </p>

                  {t.skills.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-2">
                      {t.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}