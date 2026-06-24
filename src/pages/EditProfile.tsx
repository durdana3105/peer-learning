import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { User, FileText, Code, Save, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";

interface ProfileState {
  name: string;
  bio: string;
  skills: string;
}

const EditProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { t } = useTranslation("common");

  useEffect(() => {
    const getProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setUserId(user.id);

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      setProfile(
        data
          ? {
              name: data.name || "",
              bio: data.bio || "",
              skills: Array.isArray(data.skills)
                ? data.skills.join(", ")
                : data.skills || "",
            }
          : { name: "", bio: "", skills: "" }
      );
    };

    getProfile();
  }, []);

  const handleUpdate = async () => {
    if (!profile) return;

    if (profile.name?.length > 50) {
      toast.error(t("editProfile.errorNameLength"));
      return;
    }
    if (profile.bio?.length > 300) {
      toast.error(t("editProfile.errorBioLength"));
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: profile.name,
          bio: profile.bio,
          skills:
            typeof profile.skills === "string"
              ? profile.skills
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
              : profile.skills,
        })
        .eq("id", userId as string);

      if (error) throw error;
      toast.success(t("editProfile.successMsg"));
      navigate("/profile");
    } catch (err: unknown) {
      console.error("Failed to update profile:", err);
      toast.error(t("editProfile.errorUpdate"));
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  const nameCharsLeft = 50 - (profile.name?.length || 0);
  const bioCharsLeft = 300 - (profile.bio?.length || 0);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#020617] via-[#020B1F] to-[#050014] text-white">
      {/* Background glows */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.12),transparent)] pointer-events-none" />
      <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-2xl shadow-[0_0_60px_rgba(34,211,238,0.1)]"
        >
          {/* Header */}
          <div className="mb-8">
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="mb-6 flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("editProfile.back")}
            </button>

            <h1 className="text-3xl font-bold text-white">{t("editProfile.title")}</h1>
            <p className="mt-1 text-sm text-slate-400">
              {t("editProfile.subtitle")}
            </p>
          </div>

          {/* Form fields */}
          <div className="space-y-6">

            {/* Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <User className="h-4 w-4 text-cyan-400" />
                {t("editProfile.fullName")}
              </label>
              <Input
                placeholder={t("editProfile.namePlaceholder")}
                value={profile.name}
                onChange={(e) =>
                  setProfile({ ...profile, name: e.target.value })
                }
                maxLength={50}
                className="bg-white/5 border border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />
              <p className={`text-xs text-right ${nameCharsLeft <= 10 ? "text-amber-400" : "text-slate-500"}`}>
                {t("editProfile.charsLeft", { count: nameCharsLeft })}
              </p>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <FileText className="h-4 w-4 text-cyan-400" />
                {t("editProfile.bio")}
              </label>
              <textarea
                placeholder={t("editProfile.bioPlaceholder")}
                value={profile.bio}
                onChange={(e) =>
                  setProfile({ ...profile, bio: e.target.value })
                }
                maxLength={300}
                rows={4}
                className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
              />
              <p className={`text-xs text-right ${bioCharsLeft <= 30 ? "text-amber-400" : "text-slate-500"}`}>
                {t("editProfile.charsLeft", { count: bioCharsLeft })}
              </p>
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <Code className="h-4 w-4 text-cyan-400" />
                {t("editProfile.skills")}
              </label>
              <Input
                placeholder={t("editProfile.skillsPlaceholder")}
                value={profile.skills}
                onChange={(e) =>
                  setProfile({ ...profile, skills: e.target.value })
                }
                className="bg-white/5 border border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />
              <p className="text-xs text-slate-500">{t("editProfile.skillsHelper")}</p>
            </div>
          </div>

          {/* Save button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="mt-8"
          >
            <Button
              onClick={handleUpdate}
              disabled={isSaving}
              className="w-full bg-cyan-400 hover:bg-cyan-300 text-black font-semibold shadow-[0_0_20px_rgba(34,211,238,0.3)] disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("editProfile.saving")}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {t("editProfile.saveChanges")}
                </>
              )}
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default EditProfile;