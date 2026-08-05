import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowLeft, Bell, Mail, Smartphone, Save, Moon, Sun } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "next-themes";

type NotificationCategory = "messages" | "sessions" | "friends";
type NotificationChannels = {
  email: boolean;
  inApp: boolean;
};
type NotificationPreferences = Record<NotificationCategory, NotificationChannels>;

const DEFAULT_PREFERENCES: NotificationPreferences = {
  messages: { email: true, inApp: true },
  sessions: { email: true, inApp: true },
  friends: { email: false, inApp: true },
};

const Settings = () => {
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          const { data, error } = await supabase
            .from("profiles")
            .select("notification_preferences")
            .eq("id", user.id)
            .maybeSingle();

          if (data && data.notification_preferences) {
            setPreferences(data.notification_preferences as NotificationPreferences);
            return;
          }
        }
      } catch (e) {
        console.error("Failed to load preferences from DB", e);
      }
      
      // Fallback to local storage if DB fetch fails or is null
      const saved = localStorage.getItem("notification_preferences");
      if (saved) {
        try {
          setPreferences(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse preferences", e);
        }
      }
    };
    
    loadPreferences();
  }, []);

  const handleToggle = (category: NotificationCategory, channel: keyof NotificationChannels) => {
    setPreferences((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: !prev[category][channel],
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (userId) {
        const { error } = await supabase
          .from("profiles")
          .update({ notification_preferences: preferences })
          .eq("id", userId);
          
        if (error) throw error;
      }

      localStorage.setItem("notification_preferences", JSON.stringify(preferences));
      toast.success("Notification preferences saved successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save preferences to database.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-hidden pb-20">
      {/* Background glow effects */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex justify-center min-h-screen p-6 pt-12 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-3xl rounded-[36px] border border-white/10 bg-white/5 backdrop-blur-2xl p-6 md:p-10 shadow-[0_0_60px_rgba(34,211,238,0.05)]"
        >
          {/* Header */}
          <div className="mb-10">
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-gray-300 px-4 py-2 rounded-full hover:border-cyan-400/50 hover:text-cyan-300 transition mb-6"
            >
              <ArrowLeft size={16} /> Back to Dashboard
            </button>

            <div className="flex items-center gap-4">
              <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-400/20 text-cyan-400">
                <Bell size={28} />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">Notification Preferences</h1>
                <p className="text-gray-400 mt-1">Control how and when you want to be notified.</p>
              </div>
            </div>
          </div>

          {/* Preferences Table */}
          <div className="bg-black/20 rounded-3xl border border-white/5 overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-5 border-b border-white/5 bg-white/5 font-semibold text-sm text-gray-300 uppercase tracking-wider">
              <div className="col-span-6 md:col-span-8">Event</div>
              <div className="col-span-3 md:col-span-2 text-center flex items-center justify-center gap-2">
                <Mail size={16} /> <span className="hidden md:inline">Email</span>
              </div>
              <div className="col-span-3 md:col-span-2 text-center flex items-center justify-center gap-2">
                <Smartphone size={16} /> <span className="hidden md:inline">In-App</span>
              </div>
            </div>

            <div className="divide-y divide-white/5">
              {/* New Messages */}
              <div className="grid grid-cols-12 gap-4 p-5 items-center hover:bg-white/5 transition">
                <div className="col-span-6 md:col-span-8">
                  <h3 className="font-semibold text-lg text-gray-200">New Messages</h3>
                  <p className="text-sm text-gray-400 mt-1">Direct messages from peers and mentors.</p>
                </div>
                <div className="col-span-3 md:col-span-2 flex justify-center">
                  <ToggleSwitch
                    checked={preferences.messages.email}
                    onChange={() => handleToggle("messages", "email")}
                  />
                </div>
                <div className="col-span-3 md:col-span-2 flex justify-center">
                  <ToggleSwitch
                    checked={preferences.messages.inApp}
                    onChange={() => handleToggle("messages", "inApp")}
                  />
                </div>
              </div>

              {/* Upcoming Sessions */}
              <div className="grid grid-cols-12 gap-4 p-5 items-center hover:bg-white/5 transition">
                <div className="col-span-6 md:col-span-8">
                  <h3 className="font-semibold text-lg text-gray-200">Upcoming Sessions</h3>
                  <p className="text-sm text-gray-400 mt-1">Reminders before your study sessions start.</p>
                </div>
                <div className="col-span-3 md:col-span-2 flex justify-center">
                  <ToggleSwitch
                    checked={preferences.sessions.email}
                    onChange={() => handleToggle("sessions", "email")}
                  />
                </div>
                <div className="col-span-3 md:col-span-2 flex justify-center">
                  <ToggleSwitch
                    checked={preferences.sessions.inApp}
                    onChange={() => handleToggle("sessions", "inApp")}
                  />
                </div>
              </div>

              {/* Friend Requests */}
              <div className="grid grid-cols-12 gap-4 p-5 items-center hover:bg-white/5 transition">
                <div className="col-span-6 md:col-span-8">
                  <h3 className="font-semibold text-lg text-gray-200">Friend Requests</h3>
                  <p className="text-sm text-gray-400 mt-1">When someone sends you a connection request.</p>
                </div>
                <div className="col-span-3 md:col-span-2 flex justify-center">
                  <ToggleSwitch
                    checked={preferences.friends.email}
                    onChange={() => handleToggle("friends", "email")}
                  />
                </div>
                <div className="col-span-3 md:col-span-2 flex justify-center">
                  <ToggleSwitch
                    checked={preferences.friends.inApp}
                    onChange={() => handleToggle("friends", "inApp")}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Appearance Section */}
          <div className="mt-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-400/20 text-cyan-400">
                <Moon size={28} className="hidden dark:block" />
                <Sun size={28} className="block dark:hidden" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Appearance</h2>
                <p className="text-gray-400 mt-1">Customize the visual theme of the platform.</p>
              </div>
            </div>
            
            <div className="bg-black/20 rounded-3xl border border-white/5 overflow-hidden">
              <div className="grid grid-cols-12 gap-4 p-5 items-center hover:bg-white/5 transition">
                <div className="col-span-8">
                  <h3 className="font-semibold text-lg text-gray-200">Dark Mode</h3>
                  <p className="text-sm text-gray-400 mt-1">Toggle between light and dark mode.</p>
                </div>
                <div className="col-span-4 flex justify-end">
                  <ToggleSwitch
                    checked={theme === "dark"}
                    onChange={() => setTheme(theme === "dark" ? "light" : "dark")}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 px-8 rounded-full transition disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(34,211,238,0.4)]"
            >
              <Save size={20} />
              {isSaving ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Simple custom toggle switch component
const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-[#020617] ${
        checked ? "bg-cyan-400" : "bg-gray-600"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
};

export default Settings;
