import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

const Discover = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const fetchData = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      if (!user) {
        console.log("No user logged in");
        setLoading(false);
        return;
      }

      // current user
      const { data: current } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      setCurrentUser(current);

      // all users
      const { data: allUsers } = await supabase
        .from("users")
        .select("*");

      setUsers(allUsers || []);
    } catch (err) {
      console.log("Error:", err);
    } finally {
      setLoading(false); // 🔥 ALWAYS stop loading
    }
  };

  fetchData();
}, []);

  // 🔥 Match score function
  const getMatchScore = (user: any) => {
    if (!currentUser) return 0;

    const userSkills = user.skills?.split(",") || [];
    const myGoals = currentUser.learning_goals?.split(",") || [];

    return userSkills.filter((skill: string) =>
      myGoals.includes(skill.trim())
    ).length;
  };

  // 🔥 Filter matched users
  const matchedUsers = users
    .filter((u) => u.id !== currentUser?.id)
    .map((u) => ({
      ...u,
      score: getMatchScore(u),
    }))
    .filter((u) => u.score > 0)
    .sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-3xl font-bold">Discover Peers 🤝</h1>
        <p className="text-gray-500">Find your best learning partner</p>
      </motion.div>

      {loading ? (
        <div className="mt-10 text-center">Loading...</div>
      ) : matchedUsers.length === 0 ? (
        <div className="mt-10 text-center text-gray-500">
          No matches found 😔
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {matchedUsers.map((u) => (
            <div key={u.id} className="p-4 border rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold">{u.name}</h2>

              <p className="text-sm">
                <strong>Skills:</strong> {u.skills}
              </p>

              <p className="text-sm">
                <strong>Goals:</strong> {u.learning_goals}
              </p>

              <p className="mt-2 text-green-600 font-bold">
                Match Score: {u.score} 🔥
              </p>

              <button className="mt-3 px-4 py-1 bg-blue-500 text-white rounded">
                Connect
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Discover;