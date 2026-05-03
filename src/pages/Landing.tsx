import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Users, Calendar, MessageCircle, Trophy, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroIllustration from "@/assets/hero-illustration.png";

// Animation
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

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
  { value: "4.8", label: "Avg Rating", icon: Star },
];

const Landing = () => {
  const { scrollY, scrollYProgress } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, -120]);

  return (
    <div className="min-h-screen text-emerald-100 relative overflow-hidden">

      {/* 🔥 Cursor Glow */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-0"
        animate={{
          background: [
            "radial-gradient(600px at 20% 20%, rgba(34,197,94,0.15), transparent)",
            "radial-gradient(600px at 80% 80%, rgba(34,197,94,0.15), transparent)",
          ],
        }}
        transition={{ duration: 6, repeat: Infinity }}
      />

      {/* 📊 Scroll Progress */}
      <motion.div
        style={{ scaleX: scrollYProgress }}
        className="fixed top-0 left-0 right-0 h-1 bg-green-400 origin-left z-50"
      />

      {/* Hero */}
      <section className="relative overflow-hidden pb-16 pt-12 md:pt-20">
        
        {/* 💫 Particles */}
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-green-400 rounded-full opacity-30 absolute"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{ y: [0, -50, 0] }}
              transition={{ duration: 5 + i, repeat: Infinity }}
            />
          ))}
        </div>

        <div className="container grid lg:grid-cols-2 gap-12 items-center relative z-10">

          {/* LEFT */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
          >
            <motion.div variants={fadeUp} className="mb-4 text-emerald-300">
              <Sparkles className="inline h-4 w-4 mr-1" />
              Learn together, grow together
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-emerald-200">
              Everyone is a <span className="text-green-400">teacher</span><br />
              and a <span className="text-green-400">learner</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="mt-5 text-emerald-300/70 max-w-lg">
              PeerLearn connects students to share knowledge and grow together.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-8 flex gap-3">

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/signup">
                  <Button className="bg-green-500 text-black">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/discover">
                  <Button variant="outline" className="text-emerald-200 border-emerald-400/30">
                    Browse
                  </Button>
                </Link>
              </motion.div>

            </motion.div>
          </motion.div>

          {/* RIGHT IMAGE with PARALLAX */}
          <motion.img
            src={heroIllustration}
            alt="hero"
            className="w-full max-w-lg mx-auto"
            style={{ y }}
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          />

        </div>
      </section>

      {/* Stats */}
      <section className="py-10 bg-emerald-900/20">
        <div className="container grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-3xl font-bold text-emerald-200">{stat.value}</span>
              <p className="text-emerald-300/70">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <motion.div
              key={f.title}
              whileHover={{ rotateX: 10, rotateY: -10, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 120 }}
              className="p-6 rounded-xl bg-emerald-900/20 backdrop-blur-xl border border-white/10 hover:shadow-[0_0_25px_rgba(34,197,94,0.25)]"
            >
              <f.icon className="h-6 w-6 mb-3 text-green-400" />
              <h3 className="font-bold text-emerald-200">{f.title}</h3>
              <p className="text-sm text-emerald-300/70">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ⚠️ CTA + FOOTER UNCHANGED */}
      <section className="py-20">
        <div className="container">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-hero px-8 py-14 text-center md:px-16">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
            <div className="relative">
              <h2 className="font-heading text-3xl font-extrabold text-primary-foreground md:text-4xl">
                Ready to start learning?
              </h2>
              <p className="mx-auto mt-3 max-w-md text-primary-foreground/80">
                Join thousands of students sharing knowledge and growing together.
              </p>
              <Link to="/signup">
                <Button size="lg" className="mt-8 bg-card text-foreground text-base hover:bg-card/90">
                  Join PeerLearn — It's Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="container text-center text-sm text-muted-foreground">
          © 2026 PeerLearn. Made with ❤️
        </div>
      </footer>

    </div>
  );
};

export default Landing;