import { Calendar, Clock, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Session } from "@/data/mockData";

const statusStyles = {
  upcoming: "bg-primary/10 text-primary",
  completed: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

const SessionCard = ({ session }: { session: Session }) => (
  <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-card">
    <img
      src={session.peerAvatar}
      alt={session.peerName}
      className="h-11 w-11 rounded-lg bg-muted"
    />
    <div className="flex-1 min-w-0">
      <h4 className="font-heading font-bold text-card-foreground truncate">
        {session.subject}
      </h4>
      <p className="text-sm text-muted-foreground">with {session.peerName}</p>
      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {session.date}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {session.time}
        </span>
        <span>{session.duration} min</span>
      </div>
    </div>
    <div className="flex flex-col items-end gap-2">
      <Badge className={statusStyles[session.status]}>{session.status}</Badge>
      {session.status === "upcoming" && (
        <Button size="sm" variant="outline" className="text-xs">
          Join
        </Button>
      )}
      {session.status === "completed" && session.rating && (
        <span className="flex items-center gap-1 text-xs text-warning">
          <CheckCircle2 className="h-3 w-3" /> {session.rating}/5
        </span>
      )}
    </div>
  </div>
);

export default SessionCard;
