type StatsCardProps = {
  title: string;
  value: string | number;
};

function StatsCard({ title, value }: StatsCardProps) {
  return (
    <div className="rounded-3xl border border-cyan-500/10 bg-zinc-900/70 backdrop-blur-md p-8 shadow-lg hover:border-cyan-400/40 hover:-translate-y-1 hover:shadow-cyan-500/10 transition-all duration-300">
      <h2 className="text-zinc-400 text-sm font-medium">{title}</h2>

      <p className="text-5xl font-bold mt-4 text-white">{value}</p>
    </div>
  );
}

export default StatsCard;
