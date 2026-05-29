import { useEffect, useState } from "react";

type Contributor = {
  login: string;
  avatar_url: string;
  contributions: number;
};

function Leaderboard() {
  const [contributors, setContributors] = useState<Contributor[]>([]);

  useEffect(() => {
    fetch("https://api.github.com/repos/durdana3105/peer-learning/contributors")
      .then((res) => res.json())
      .then((data) => setContributors(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="mt-8 bg-zinc-900/70 border border-cyan-500/10 rounded-3xl p-8">
      <h2 className="text-3xl font-semibold mb-6">
        Top Contributors
      </h2>

      <div className="space-y-5">
        {(Array.isArray(contributors) ? contributors.slice(0, 5) : []).map((user, index) => (
          <div
            key={user.login}
            className="flex items-center justify-between bg-zinc-800/70 rounded-2xl px-5 py-5 border border-zinc-700 hover:border-cyan-500/30 transition-all"
          >
            <div className="flex items-center gap-4">
              
              <div className="w-10 text-cyan-400 font-bold">
                #{index + 1}
              </div>

              <img
                src={user.avatar_url}
                alt={user.login}
                className="w-12 h-12 rounded-full border border-cyan-500/30"
              />

              <p className="text-lg font-medium">
                {user.login}
              </p>
            </div>

            <p className="text-cyan-400 font-semibold text-lg">
              {user.contributions} commits
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Leaderboard;