import { Check, HelpCircle, X } from "lucide-react";

type RsvpStatus = "going" | "maybe" | "cant_attend";

type RsvpSectionProps = {
  sessionStatus: string;
  myRsvp: RsvpStatus | null;
  rsvpCounts: {
    going: number;
    maybe: number;
    cant_attend: number;
  };
  rsvpLoading: boolean;
  updateRsvp: (status: RsvpStatus) => void;
};

const options: {
  status: RsvpStatus;
  label: string;
  icon: typeof Check;
}[] = [
  {
    status: "going",
    label: "Going",
    icon: Check,
  },
  {
    status: "maybe",
    label: "Maybe",
    icon: HelpCircle,
  },
  {
    status: "cant_attend",
    label: "Can't Attend",
    icon: X,
  },
];

export function RsvpSection({
  sessionStatus,
  myRsvp,
  rsvpCounts,
  rsvpLoading,
  updateRsvp,
}: RsvpSectionProps) {
    if (sessionStatus !== "scheduled") {
    return null;
  }
  return (
    <div className="mt-4 bg-white/5 border border-white/10 rounded-2xl p-4">
      <div className="mb-3">
        <h3 className="font-semibold text-white">RSVP</h3>
        <p className="text-xs text-gray-400 mt-1">
          Let the host know if you plan to attend.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {options.map(({ status, label, icon: Icon }) => {
          const selected = myRsvp === status;
          const count = rsvpCounts[status];

          return (
            <button
              key={status}
              type="button"
              disabled={rsvpLoading}
              onClick={() => updateRsvp(status)}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl border px-2 py-3 text-sm transition ${
                selected
                  ? "border-cyan-400 bg-cyan-400/10 text-cyan-300"
                  : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
              } ${rsvpLoading ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <Icon size={18} />
              <span>{label}</span>
              <span className="text-xs text-gray-400">{count}</span>
            </button>
          );
        })}
      </div>

      {myRsvp && (
        <p className="text-xs text-gray-400 mt-3">
          Your response:{" "}
          <span className="text-cyan-300 font-medium">
            {myRsvp === "going"
              ? "Going"
              : myRsvp === "maybe"
                ? "Maybe"
                : "Can't Attend"}
          </span>
        </p>
      )}
    </div>
  );
}