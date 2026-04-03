import { motion } from "framer-motion";
import { ArrowRight, Users, Calendar, MessageCircle, Trophy, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroIllustration from "@/assets/hero-illustration.png";

const features = [
  {
    icon: Users,
    title: "Smart Matching",
    description: "Our algorithm finds the perfect learning partner based on your skills and interests.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Calendar,
    title: "Easy Scheduling",
    description: "Book 1:1 sessions with a few clicks. Sync with your calendar effortlessly.",
    color: "bg-secondary/20 text-secondary-foreground",
  },
  {
    icon: MessageCircle,
    title: "Real-time Chat",
    description: "Message your peers instantly. Share resources and stay connected.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: Trophy,
    title: "Gamification",
    description: "Earn points, unlock badges, and climb the leaderboard as you learn and teach.",
    color: "bg-warning/10 text-warning",
  },
];

const stats = [
  { value: "10K+", label: "Active Learners" },
  { value: "5K+", label: "Sessions Completed" },
  { value: "200+", label: "Subjects" },
  { value: "4.8", label: "Avg Rating", icon: Star },
];

const Landing = () => (
  <div className="min-h-screen">
    {/* Hero */}
    <section className="relative overflow-hidden pb-16 pt-12 md:pt-20">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,hsl(152_60%_42%/0.08),transparent_60%)]" />
      <div className="container">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              Learn together, grow together
            </div>
            <h1 className="font-heading text-4xl font-extrabold leading-tight tracking-tight md:text-5xl lg:text-6xl">
              Everyone is a{" "}
              <span className="text-gradient-hero">teacher</span>
              <br />
              and a{" "}
              <span className="text-gradient-hero">learner</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              PeerLearn connects students who want to share knowledge. Teach what you know, learn what you love — all for free.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/signup">
                <Button size="lg" className="bg-gradient-hero text-primary-foreground text-base hover:opacity-90 shadow-glow">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/discover">
                <Button size="lg" variant="outline" className="text-base">
                  Browse Peers
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex justify-center"
          >
            <img
              src={heroIllustration}
              alt="Students learning together"
              width={1024}
              height={768}
              className="w-full max-w-lg animate-float"
            />
          </motion.div>
        </div>
      </div>
    </section>

    {/* Stats */}
    <section className="border-y border-border bg-card/50 py-10">
      <div className="container">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-1">
                <span className="font-heading text-3xl font-extrabold text-foreground md:text-4xl">
                  {stat.value}
                </span>
                {stat.icon && <stat.icon className="h-5 w-5 fill-warning text-warning" />}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Features */}
    <section className="py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-extrabold md:text-4xl">
            Everything you need to learn <span className="text-gradient-hero">peer-to-peer</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            A complete toolkit for collaborative learning between students.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group rounded-2xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:shadow-card-hover"
            >
              <div className={`inline-flex rounded-xl p-3 ${feature.color}`}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-heading text-lg font-bold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
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
              <Button
                size="lg"
                className="mt-8 bg-card text-foreground text-base hover:bg-card/90"
              >
                Join PeerLearn — It's Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>

    {/* Footer */}
    <footer className="border-t border-border py-8">
      <div className="container text-center text-sm text-muted-foreground">
        © 2026 PeerLearn. Made with ❤️ for learners everywhere.
      </div>
    </footer>
  </div>
);

export default Landing;
