interface ParticipantCardProps {
  name: string;
  status?: "online" | "idle" | "offline";
}

export default function ParticipantCard({
  name,
  status = "online",
}: ParticipantCardProps) {
  const statusStyles = {
    online: {
      text: "Online",
      dot: "bg-green-500",
      label: "text-green-400",
    },
    idle: {
      text: "Idle",
      dot: "bg-yellow-500",
      label: "text-yellow-400",
    },
    offline: {
      text: "Offline",
      dot: "bg-gray-500",
      label: "text-gray-400",
    },
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 flex items-center gap-3 hover:border-blue-500 transition">
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-semibold">
          {name.charAt(0).toUpperCase()}
        </div>

        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border border-slate-900 ${statusStyles[status].dot}`}
        />
      </div>

      <div>
        <p className="text-sm font-medium text-white">
          {name}
        </p>

        <p
          className={`text-xs ${statusStyles[status].label}`}
        >
          {statusStyles[status].text}
        </p>
      </div>
    </div>
  );
}