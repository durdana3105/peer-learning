interface ActivityFeedProps {
  activities: string[];
}

export default function ActivityFeed({
  activities,
}: ActivityFeedProps) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
      <h2 className="font-semibold mb-4">
        Live Activity Feed
      </h2>

      <div className="space-y-3 max-h-72 overflow-y-auto">
        {activities.length === 0 ? (
          <p className="text-slate-500 text-sm">
            No recent activity
          </p>
        ) : (
          activities.map((activity, index) => (
            <div
              key={index}
              className="text-sm text-slate-300 border-b border-slate-800 pb-2"
            >
              ⚡ {activity}
            </div>
          ))
        )}
      </div>
    </div>
  );
}