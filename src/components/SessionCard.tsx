import { Calendar, Clock, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Session } from "@/types";

const statusStyles: Record<string, string> = {
  upcoming: "bg-primary/10 text-primary",
  scheduled: "bg-primary/10 text-primary",
  live: "bg-success/10 text-success",
  completed: "bg-success/10 text-success",
  ended: "bg-muted/10 text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

const formatScheduledAt = (scheduled_at: string | null) => {
  if (!scheduled_at) return { date: "TBD", time: "" };
  const d = new Date(scheduled_at);
  return {
    date: d.toLocaleDateString(undefined, { dateStyle: "medium" }),
    time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  };
};

const SessionCard = ({ session }: { session: Session }) => {
  const { date, time } = formatScheduledAt(session.scheduled_at);
  const statusKey = session.status?.toLowerCase() ?? "";

  return (
    <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 shadow-card">
      {/* Icon placeholder replacing stale peerAvatar */}
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Calendar className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-heading font-bold text-card-foreground truncate">
          {session.title ?? "Untitled Session"}
        </h4>

        {session.description && (
          <p className="text-sm text-muted-foreground truncate">{session.description}</p>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {session.scheduled_at && (
            <>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {time}
              </span>
            </>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {session.duration_minutes} min
          </span>
        </div>

        {session.tags && session.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            <Tag className="h-3 w-3 text-muted-foreground" />
            {session.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <Badge className={statusStyles[statusKey] ?? "bg-muted/10 text-muted-foreground"}>
          {session.status}
        </Badge>
        {(statusKey === "upcoming" || statusKey === "scheduled" || statusKey === "live") && (
          <Button size="sm" variant="outline" className="text-xs">
            Join
          </Button>
        )}
      </div>
    </div>
  );
};

export default SessionCard;

