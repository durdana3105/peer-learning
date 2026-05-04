import { motion, useScroll } from "framer-motion";
import { ArrowRight, Users, Calendar, MessageCircle, Trophy, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import heroIllustration from "@/assets/hero-illustration.png";

const features = [
  { icon: Users, title: "Smart Matching", description: "Perfect partner based on skills." },
  { icon: Calendar, title: "Easy Scheduling", description: "Book sessions easily." },
  { icon: MessageCircle, title: "Real-time Chat", description: "Instant communication." },
  { icon: Trophy, title: "Gamification", description: "Earn rewards & points." },
];

const stats = [
  { value: "10K+", label: "Active Learners" },
  { value: "5K+", label: "Sessions Completed" },
  { value: "200+", label: "Subjects" },
  { value: "4.8", label: "Avg Rating" },
];

const faqs = [
  { q: "Is PeerLearn free?", a: "Yes, core features are free for all users." },
  { q: "Who can join?", a: "Students, developers, and anyone eager to learn." },
  { q: "How does matching work?", a: "We match based on interests, skills, and goals." },
];

export default function Landing() {
  const { scrollYProgress } = useScroll();
  const [open, setOpen] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  // ✅ Loader
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#020617]">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 1 }}
          transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
          className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-yellow-400 bg-clip-text text-transparent"
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
      className="min-h-screen bg-gradient-to-br from-[#020617] via-[#031b14] to-[#020617]"
    >

      {/* 🌟 Background Glow */}
    <motion.div
  className="absolute inset-0 pointer-events-none"
  animate={{
    background: [
      "radial-gradient(600px at 20% 20%, rgba(16,185,129,0.15), transparent)",
      "radial-gradient(600px at 80% 80%, rgba(250,204,21,0.15), transparent)"
    ]
  }}
  transition={{ duration: 6, repeat: Infinity }}
/>

      {/* ✨ Floating Particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-emerald-400 rounded-full absolute opacity-20"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{ y: [0, -40, 0] }}
          transition={{ duration: 5 + i, repeat: Infinity }}
        />
      ))}

      {/* Scroll Bar */}
      <motion.div
        style={{ scaleX: scrollYProgress }}
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-yellow-400 origin-left z-50"
      />

      {/* HERO */}
      <section className="container grid lg:grid-cols-2 gap-12 items-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-yellow-400 mb-3 flex items-center gap-2">
            <Sparkles /> Learn together, grow together
          </p>

          <h1 className="text-5xl font-extrabold leading-tight">
            Everyone is a{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-yellow-300 to-emerald-500 bg-clip-text text-transparent">
              teacher
            </span>{" "}
            and a{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-yellow-300 to-emerald-500 bg-clip-text text-transparent">
              learner
            </span>
          </h1>

          <p className="mt-4 text-emerald-300/70 max-w-md">
            Learn, collaborate, and grow with peers in a beautiful learning ecosystem.
          </p>

          <div className="mt-6 flex gap-4">
            <Link to="/signup">
              <Button className="bg-yellow-400 text-black hover:scale-110 transition">
                Get Started <ArrowRight />
              </Button>
            </Link>
          </div>
        </motion.div>

       <div className="relative">
  <div className="absolute inset-0 bg-yellow-400/20 blur-3xl rounded-full" />
  <img src={heroIllustration} className="relative z-10" />
</div>


      </section>
<div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-16" />
      {/* STATS */}
<section className="container grid grid-cols-2 md:grid-cols-4 gap-6 text-center py-10">
  {stats.map((s, i) => (
    <motion.div
      key={i}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.2 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl 
      shadow-[0_0_20px_rgba(16,185,129,0.08)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] transition"
    >
      <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-yellow-400 bg-clip-text text-transparent">
        {s.value}
      </h3>
      <p className="text-emerald-300/70">{s.label}</p>
    </motion.div>
  ))}
</section>

{/* DIVIDER */}
<div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-16" />

{/* REVIEWS */}
<section className="container py-20">
  <motion.h2
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="text-3xl font-bold text-center mb-10"
  >
    Loved by Learners
  </motion.h2>

  <div className="grid md:grid-cols-3 gap-6">
    {[
      { name: "Aisha", text: "Helped me stay consistent every day. ☺️👌" },
      { name: "Rahul", text: "Found amazing study partners.😍" },
      { name: "John", text: "My coding improved 2x faster.🥺🙌" },
    ].map((t, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.2 }}
        viewport={{ once: true }}
        whileHover={{ y: -8 }}
        className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl
        hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] transition"
      >
        <p className="text-emerald-300/80">“{t.text}”</p>
        <div className="mt-4 text-yellow-400 font-semibold">{t.name}</div>
      </motion.div>
    ))}
  </div>
</section>

{/* DIVIDER */}
<div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-16" />

{/* FEATURES */}
<section className="container grid md:grid-cols-2 lg:grid-cols-4 gap-6 py-20">
  {features.map((f, i) => (
    <motion.div
      key={i}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.15 }}
      viewport={{ once: true }}
      whileHover={{ y: -10 }}
      className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl
      hover:shadow-[0_0_30px_rgba(250,204,21,0.2)] transition"
    >
      <f.icon className="text-yellow-400 mb-3" />
      <h3 className="font-bold">{f.title}</h3>
      <p className="text-sm text-emerald-300/70">{f.description}</p>
    </motion.div>
  ))}
</section>

{/* DIVIDER */}
<div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-16" />

{/* FAQ */}
<section className="container py-20 max-w-3xl mx-auto">
  <h2 className="text-3xl font-bold text-center mb-10">
    Frequently Asked Questions
  </h2>

  {faqs.map((item, i) => (
    <motion.div
      key={i}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mb-4 border border-white/10 rounded-xl overflow-hidden backdrop-blur"
    >
      <button
        onClick={() => setOpen(open === i ? null : i)}
        className="w-full flex justify-between items-center p-4 bg-white/5 hover:bg-white/10 transition"
      >
        {item.q}
        <ChevronDown />
      </button>

      {open === i && (
        <div className="p-4 text-emerald-300/70">{item.a}</div>
      )}
    </motion.div>
  ))}
</section>

{/* FOOTER / CTA */}
<section className="container pb-20">
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    whileHover={{ scale: 1.02 }}
    className="relative p-10 rounded-3xl bg-[#020617] border border-white/20 backdrop-blur-xl text-center transition 
    hover:shadow-[0_0_50px_rgba(255,255,255,0.25)]"
  >

    
    

    ✨ White glowing border
    <motion.div
      className="absolute inset-0 rounded-3xl pointer-events-none"
      animate={{
        boxShadow: [
          "0 0 10px rgba(255,255,255,0.05)",
          "0 0 30px rgba(255,255,255,0.25)",
          "0 0 10px rgba(255,255,255,0.05)"
        ]
      }}
      transition={{ duration: 2.5, repeat: Infinity }}
    />

    {/* 🌟 Title */}
    <h3 className="text-lg font-semibold text-emerald-400 mb-2">
      © 2026 PeerLearn
    </h3>

    <p className="text-emerald-300/60 mb-6">
      Built with ❤️ for collaborative learning
    </p>

    {/* 🔗 Links */}
    <div className="flex justify-center gap-6 mb-6 text-sm">
      <a href="#features" className="hover:text-yellow-400 transition">
        Features
      </a>
      <a href="#faq" className="hover:text-yellow-400 transition">
        FAQ
      </a>
      <a href="#top" className="hover:text-yellow-400 transition">
        Home
      </a>
    </div>

    {/* 🌐 Social icons */}
    <div className="flex justify-center gap-5">
      {["🐦", "💼", "📸"].map((icon, i) => (
        <motion.div
          key={i}
          whileHover={{ scale: 1.2, rotate: 8 }}
          className="text-xl cursor-pointer"
        >
          {icon}
        </motion.div>
      ))}
    </div>

  </motion.div>
</section>
    </motion.div>
  );
}