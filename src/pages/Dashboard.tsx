import { motion } from "framer-motion";
import { Calendar, Trophy, TrendingUp, BookOpen, Star } from "lucide-react";
import PeerCard from "@/components/PeerCard";
import SessionCard from "@/components/SessionCard";
import { currentUser, peers, sessions, leaderboard } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const Dashboard = () => {
  const upcomingSessions = sessions.filter((s) => s.status === "upcoming");
  const topPeers = peers.slice(0, 3);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-heading text-3xl font-extrabold">
            Welcome back, {currentUser.name.split(" ")[0]}! 👋
          </h1>
          <p className="mt-1 text-muted-foreground">
            Here's what's happening with your learning journey.
          </p>
        </motion.div>

        {/* Stats Row */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { icon: BookOpen, label: "Sessions", value: currentUser.sessionsCompleted, color: "text-primary" },
            { icon: Star, label: "Rating", value: currentUser.rating, color: "text-warning" },
            { icon: Trophy, label: "Points", value: currentUser.points, color: "text-accent" },
            { icon: TrendingUp, label: "Badges", value: currentUser.badges.length, color: "text-primary" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-border bg-card p-4 shadow-card"
            >
              <div className="flex items-center gap-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
              <p className="mt-2 font-heading text-2xl font-extrabold">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-8 lg:col-span-2">
            {/* Upcoming Sessions */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-heading text-xl font-bold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Upcoming Sessions
                </h2>
                <span className="text-sm text-muted-foreground">
                  {upcomingSessions.length} scheduled
                </span>
              </div>
              <div className="space-y-3">
                {upcomingSessions.map((s) => (
                  <SessionCard key={s.id} session={s} />
                ))}
              </div>
            </section>

            {/* Recommended Peers */}
            <section>
              <h2 className="mb-4 font-heading text-xl font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Recommended for You
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {topPeers.map((p, i) => (
                  <PeerCard key={p.id} peer={p} index={i} />
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Preview */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="h-14 w-14 rounded-xl bg-muted"
                />
                <div>
                  <h3 className="font-heading font-bold">{currentUser.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                    {currentUser.rating} · {currentUser.sessionsCompleted} sessions
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Level Progress</span>
                  <span className="font-medium">{currentUser.points} pts</span>
                </div>
                <Progress value={(currentUser.points / 2000) * 100} className="mt-2 h-2" />
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {currentUser.badges.map((b) => (
                  <Badge key={b} variant="secondary" className="text-xs">
                    {b}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Leaderboard */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <h3 className="font-heading font-bold flex items-center gap-2">
                <Trophy className="h-5 w-5 text-warning" />
                Leaderboard
              </h3>
              <div className="mt-4 space-y-3">
                {leaderboard.map((entry) => (
                  <div key={entry.rank} className="flex items-center gap-3">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      entry.rank <= 3
                        ? "bg-gradient-warm text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {entry.rank}
                    </span>
                    <img
                      src={entry.avatar}
                      alt={entry.name}
                      className="h-8 w-8 rounded-lg bg-muted"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{entry.name}</p>
                    </div>
                    <span className="text-sm font-bold text-primary">{entry.points}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
