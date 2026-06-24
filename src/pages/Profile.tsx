import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

import { Camera, Save, Sparkles, User, Flame, Zap, Trophy, Lock } from "lucide-react";
import StreakStats from "@/components/StreakStats";
import { AvatarUpload } from "@/components/AvatarUpload";

import {
  calculateLevel,
  getBadgeByXP,
  getAchievements,
  ALL_BADGES,
  ALL_ACHIEVEMENTS
} from "../lib/gamification";

const avatars = [
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Alex",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=John",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Emma",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Sarah",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=David",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Sophia",
];

const Profile = () => {
  const navigate = useNavigate();
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
          xp: profileData.points || 0,
          level: calculateLevel(profileData.points || 0),
          badge: getBadgeByXP(profileData.points || 0),
          achievements: getAchievements(profileData.points || 0),
        });
      }
    };

    fetchProfile();
  }, []);

  // SAVE PROFILE
  const handleSave = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const user = data?.session?.user;
      if (!user) {
        toast.error("Your session has expired. Please log in again.");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          name: profile.name,
          bio: profile.bio,
          skills: Array.isArray(profile.skills) ? profile.skills : profile.skills.split(",").map((s: string) => s.trim()).filter(Boolean),
          avatar_url: profile.avatar_url,
        })
        .eq("id", user.id);

      if (error) {
        toast.error("Failed to update profile: " + error.message);
      } else {
        toast.success("Profile updated successfully!");
      }
    } catch (err: any) {
      toast.error("An unexpected error occurred: " + err.message);
    } finally {
      setLoading(false);
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
            <button
              onClick={() => navigate('/profile')}
              className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-gray-300 px-4 py-2 rounded-full hover:border-cyan-400/50 hover:text-cyan-300 transition mt-2"
            >
              ← Back to Profile
            </button>
            <p className="text-gray-400 text-lg">
              Build your learning identity 🚀
            </p>
          </div>

          {/* AVATAR */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Choose Your Avatar</h2>

            {/* CURRENT AVATAR */}
            <div className="flex justify-center mb-8">
              <AvatarUpload
                currentAvatarUrl={profile.avatar_url}
                onUploadSuccess={(url) => setProfile({ ...profile, avatar_url: url })}
                onUploadError={(error) => alert(error)}
              />
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
                  className={`relative rounded-full p-1 transition-all ${profile.avatar_url === avatar
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
              className="rounded-3xl border border-cyan-400/10 bg-cyan-500/5 p-6 md:col-span-1"
            >
              <div className="flex items-center gap-3 mb-3">
                <Zap className="text-cyan-400" />
                <h2 className="font-bold text-lg">Total XP</h2>
              </div>
              <p className="text-4xl font-bold">{profile.xp || 0} XP ⚡</p>
              <p className="text-sm text-gray-400 mt-2">
                Earn XP by joining sessions
              </p>
              <div className="mt-6 pt-6 border-t border-cyan-400/10">
                <p className="text-sm text-gray-400 mb-1">Current Level</p>
                <p className="text-2xl font-bold text-cyan-300">Level {profile.level}</p>
              </div>
            </motion.div>
          </div>

          {/* TROPHY ROOM */}
          <div className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="text-yellow-400" size={28} />
              <h2 className="text-3xl font-bold">Trophy Room</h2>
            </div>

            <div className="space-y-10">
              {/* BADGES */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-300">Milestone Badges</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {ALL_BADGES.map((badge) => {
                    const isUnlocked = profile.xp >= badge.xpRequired;
                    return (
                      <motion.div
                        key={badge.id}
                        whileHover={isUnlocked ? { scale: 1.05 } : {}}
                        className={`relative overflow-hidden rounded-2xl p-5 border transition-all ${isUnlocked
                          ? "bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.15)]"
                          : "bg-white/5 border-white/5 opacity-60 grayscale"
                          }`}
                      >
                        {!isUnlocked && (
                          <div className="absolute top-3 right-3 text-gray-500">
                            <Lock size={16} />
                          </div>
                        )}
                        <div className="text-4xl mb-3">{badge.name.split(' ')[0]}</div>
                        <h4 className={`font-bold ${isUnlocked ? "text-yellow-400" : "text-gray-400"}`}>
                          {badge.name.substring(badge.name.indexOf(' ') + 1)}
                        </h4>
                        <p className="text-xs text-gray-400 mt-1">{badge.description}</p>

                        {/* Progress Bar for Locked */}
                        {!isUnlocked && (
                          <div className="mt-3">
                            <div className="w-full bg-black/50 rounded-full h-1.5 mb-1 overflow-hidden">
                              <div
                                className="bg-gray-500 h-1.5 rounded-full"
                                style={{ width: `${Math.min(100, (profile.xp / badge.xpRequired) * 100)}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-right text-gray-500">{profile.xp} / {badge.xpRequired} XP</p>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* ACHIEVEMENTS */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-300">Achievements</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {ALL_ACHIEVEMENTS.map((achievement) => {
                    const isUnlocked = profile.xp >= achievement.xpRequired;
                    return (
                      <motion.div
                        key={achievement.id}
                        whileHover={isUnlocked ? { y: -5 } : {}}
                        className={`rounded-2xl p-4 border flex flex-col items-center text-center transition-all ${isUnlocked
                          ? "bg-cyan-500/10 border-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                          : "bg-white/5 border-white/5 opacity-50 grayscale"
                          }`}
                      >
                        <div className="text-3xl mb-2">{achievement.icon}</div>
                        <h4 className={`font-bold text-sm ${isUnlocked ? "text-cyan-300" : "text-gray-500"}`}>
                          {achievement.name}
                        </h4>
                        {!isUnlocked && (
                          <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-500 bg-black/30 px-2 py-1 rounded-md">
                            <Lock size={10} /> {achievement.xpRequired} XP
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
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

export default Profile;

// feat/sync-theme-supabase
