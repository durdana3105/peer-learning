import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

import { Camera, Save, Sparkles, User, Flame, Zap, Trophy } from "lucide-react";
import StreakStats from "@/components/StreakStats";

import {
  calculateLevel,
  getBadgeByXP,
  getAchievements,
} from "../lib/gamification";

const avatars = [
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Alex",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=John",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Emma",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Sarah",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=David",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Sophia",
];

const EditProfile = () => {
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState<any>({
    name: "",
    bio: "",
    skills: "",
    avatar_url: "",
    streak: 0,
    xp: 0,
    level: 1,
    badge: "",
    achievements: [],
  });

  // FETCH PROFILE
  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase.auth.getSession();

      const user = data?.session?.user;

      if (!user) return;

      const { data: rawProfileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      const profileData = rawProfileData as any;

      if (profileData) {
        setProfile({
          name: profileData.name || "",
          bio: profileData.bio || "",
          skills: profileData.skills?.join(", ") || "",
          avatar_url: profileData.avatar_url || avatars[0],
          streak: profileData.streak || 0,
          xp: profileData.xp || 0,
          level: calculateLevel(profileData.xp || 0),
          badge: getBadgeByXP(profileData.xp || 0),
          achievements: getAchievements(profileData.xp || 0),
        });
      }
    };

    fetchProfile();
  }, []);

  // SAVE PROFILE
  const handleSave = async () => {
    setLoading(true);

    const { data } = await supabase.auth.getSession();

    const user = data?.session?.user;

    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        name: profile.name,
        bio: profile.bio,
        skills: profile.skills.split(",").map((s: string) => s.trim()),
        avatar_url: profile.avatar_url,
      })
      .eq("id", user.id);

    setLoading(false);

    if (!error) {
      alert("Profile Updated Successfully 🚀");
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-hidden">
      {/* BACKGROUND GLOW */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/20 blur-[120px] rounded-full" />

      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 blur-[120px] rounded-full" />

      <div className="relative z-10 flex justify-center items-center min-h-screen p-6">
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="w-full max-w-4xl rounded-[36px] border border-white/10 bg-white/5 backdrop-blur-2xl p-8"
        >
          {/* HEADER */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 px-4 py-2 rounded-full mb-4">
              <Sparkles size={16} />
              Personalize Your Profile
            </div>

            <h1 className="text-5xl font-bold mb-3">Edit Profile</h1>

            <p className="text-gray-400 text-lg">
              Build your learning identity 🚀
            </p>
          </div>

          {/* AVATAR */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Choose Your Avatar</h2>

            {/* CURRENT AVATAR */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <img
                  src={profile.avatar_url}
                  alt="avatar"
                  className="w-36 h-36 rounded-full border-4 border-cyan-400 object-cover shadow-2xl shadow-cyan-500/20"
                />

                <div className="absolute bottom-2 right-2 bg-cyan-400 p-3 rounded-full">
                  <Camera size={20} className="text-black" />
                </div>
              </div>
            </div>

            {/* AVATAR OPTIONS */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-5">
              {avatars.map((avatar, index) => (
                <motion.button
                  whileHover={{
                    scale: 1.08,
                  }}
                  whileTap={{
                    scale: 0.95,
                  }}
                  key={index}
                  onClick={() =>
                    setProfile({
                      ...profile,
                      avatar_url: avatar,
                    })
                  }
                  className={`relative rounded-full p-1 transition-all ${
                    profile.avatar_url === avatar
                      ? "bg-gradient-to-r from-cyan-400 to-purple-500"
                      : "bg-white/10"
                  }`}
                >
                  <img
                    src={avatar}
                    alt="avatar"
                    className="w-20 h-20 rounded-full object-cover"
                  />

                  {profile.avatar_url === avatar && (
                    <div className="absolute inset-0 rounded-full border-4 border-cyan-400 animate-pulse" />
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* FORM */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* NAME */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Full Name
              </label>

              <div className="relative">
                <User
                  className="absolute left-4 top-4 text-gray-400"
                  size={18}
                />

                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      name: e.target.value,
                    })
                  }
                  placeholder="Enter your name"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-cyan-400 transition"
                />
              </div>
            </div>

            {/* SKILLS */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Skills</label>

              <input
                type="text"
                value={profile.skills}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    skills: e.target.value,
                  })
                }
                placeholder="React, AI/ML, Python..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 outline-none focus:border-cyan-400 transition"
              />

              <p className="text-xs text-gray-500 mt-2">
                Separate skills with commas
              </p>
            </div>
          </div>

          {/* BIO */}
          <div className="mt-6">
            <label className="block text-sm text-gray-400 mb-2">Bio</label>

            <textarea
              rows={5}
              value={profile.bio}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  bio: e.target.value,
                })
              }
              placeholder="Tell others about yourself..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-cyan-400 transition resize-none"
            />
          </div>

          {/* DYNAMIC STATS */}
          <div className="grid md:grid-cols-2 gap-5 mt-10">
            {/* STREAK STATS COMPONENT */}
            <div className="md:col-span-1">
              <StreakStats />
            </div>

            {/* XP */}
            <motion.div
              whileHover={{
                scale: 1.03,
              }}
              className="rounded-3xl border border-cyan-400/10 bg-cyan-500/5 p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <Zap className="text-cyan-400" />

                <h2 className="font-bold text-lg">Total XP</h2>
              </div>

              <p className="text-4xl font-bold">{profile.xp || 0} XP ⚡</p>

              <p className="text-sm text-gray-400 mt-2">
                Earn XP by joining sessions
              </p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="rounded-3xl border border-yellow-400/10 bg-yellow-500/5 p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <Trophy className="text-yellow-400" />

                <h2 className="font-bold text-lg">Achievements</h2>
              </div>

              <p className="text-2xl font-bold">Level {profile.level}</p>

              <p className="mt-2">Badge: {profile.badge}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {profile.achievements?.map((a: string, i: number) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full bg-cyan-500/20 text-sm"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* SAVE BUTTON */}
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full mt-10 flex items-center justify-center gap-3 bg-gradient-to-r from-cyan-400 to-purple-500 text-black py-4 rounded-2xl font-bold text-lg hover:opacity-90 transition"
          >
            <Save size={20} />

            {loading ? "Saving..." : "Save Profile"}
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default EditProfile;
