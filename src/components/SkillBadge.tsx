import { ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SkillBadgeProps {
  skill: string;
  endorsementCount: number;
  hasEndorsed: boolean;
  onEndorse: (skill: string) => void;
  canEndorse: boolean;
  loading?: boolean;
}

export function SkillBadge({
  skill,
  endorsementCount,
  hasEndorsed,
  onEndorse,
  canEndorse,
  loading = false,
}: SkillBadgeProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canEndorse) onEndorse(skill);
  };

  const tooltipLabel = !canEndorse
    ? "Sign in to endorse"
    : hasEndorsed
    ? "Remove endorsement"
    : "Endorse this skill";

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors",
              "bg-secondary text-secondary-foreground",
              hasEndorsed && "border-primary/40 bg-primary/10 text-primary"
            )}
          >
            <span>{skill}</span>

            {loading ? (
              <span className="h-4 w-6 animate-pulse rounded bg-muted-foreground/20" />
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClick}
                disabled={!canEndorse}
                aria-label={`${hasEndorsed ? "Remove endorsement for" : "Endorse"} ${skill} (${endorsementCount} endorsements)`}
                className={cn(
                  "h-5 w-auto gap-0.5 rounded-full px-1.5 py-0 text-xs",
                  "hover:bg-primary/20 focus-visible:ring-1 focus-visible:ring-primary",
                  "disabled:pointer-events-none disabled:opacity-60",
                  hasEndorsed
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                <ThumbsUp
                  className={cn("h-3 w-3", hasEndorsed && "fill-primary")}
                  aria-hidden
                />
                {endorsementCount > 0 && <span>{endorsementCount}</span>}
              </Button>
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {tooltipLabel}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}