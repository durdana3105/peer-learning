import { motion } from "framer-motion";
import { Star, BookOpen, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { User } from "@/data/mockData";

interface PeerCardProps {
  peer: User;
  onConnect?: () => void;
  index?: number;
}

const PeerCard = ({ peer, onConnect, index = 0 }: PeerCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="group rounded-2xl border border-border bg-card p-5 shadow-card transition-all duration-300 hover:shadow-card-hover"
    >
      <div className="flex items-start gap-4">
        <img
          src={peer.avatar}
          alt={peer.name}
          className="h-14 w-14 rounded-xl bg-muted"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg font-bold text-card-foreground truncate">
              {peer.name}
            </h3>
            {peer.matchScore && (
              <span className="ml-2 shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                {peer.matchScore}% match
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            <span>{peer.rating}</span>
            <span>·</span>
            <span>{peer.sessionsCompleted} sessions</span>
          </div>
        </div>
      </div>

      <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{peer.bio}</p>

      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-1.5">
          <GraduationCap className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-xs font-medium text-muted-foreground">Teaches:</span>
          <div className="flex flex-wrap gap-1">
            {peer.teachSubjects.slice(0, 3).map((s) => (
              <Badge key={s} variant="secondary" className="text-[10px] px-1.5 py-0">
                {s}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5 text-accent shrink-0" />
          <span className="text-xs font-medium text-muted-foreground">Learns:</span>
          <div className="flex flex-wrap gap-1">
            {peer.learnSubjects.slice(0, 3).map((s) => (
              <Badge key={s} variant="outline" className="text-[10px] px-1.5 py-0">
                {s}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {peer.badges.length > 0 && (
        <div className="mt-3 flex gap-1.5">
          {peer.badges.map((b) => (
            <span key={b} className="text-xs">{b}</span>
          ))}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <Button
          size="sm"
          className="flex-1 bg-gradient-hero text-primary-foreground hover:opacity-90"
          onClick={onConnect}
        >
          Connect
        </Button>
        <Button size="sm" variant="outline" className="flex-1">
          View Profile
        </Button>
      </div>
    </motion.div>
  );
};

export default PeerCard;
