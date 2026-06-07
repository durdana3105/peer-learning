import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const EditProfile = () => {
  const [profile, setProfile] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      setUserId(user.id);

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      setProfile(data || { name: "", bio: "", skills: "" });
    };

    getProfile();
  }, []);

  if (!profile) {
    return <div style={{ color: "white" }}>Loading...</div>;
  }

  const handleUpdate = async () => {
    try {
      if (profile.name?.length > 50) {
        toast.error("Name must be less than 50 characters.");
        return;
      }
      if (profile.bio?.length > 300) {
        toast.error("Bio must be less than 300 characters.");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          name: profile.name,
          bio: profile.bio,
          skills: Array.isArray(profile.skills) ? profile.skills : (profile.skills && typeof profile.skills === 'string'
            ? profile.skills.split(",").map(s => s.trim()).filter(Boolean)
            : []),
        })
        .eq("id", userId);

      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to update profile:", err);
      toast.error("Error updating profile. Please try again.");
    }
  };

  return (
    <div style={{ color: "white", padding: "20px" }}>
      <h1>Edit Profile</h1>

      <input
        placeholder="Name"
        value={profile.name}
        onChange={(e) =>
          setProfile({ ...profile, name: e.target.value })
        }
      />

      <br /><br />

      <input
        placeholder="Bio"
        value={profile.bio}
        onChange={(e) =>
          setProfile({ ...profile, bio: e.target.value })
        }
      />

      <br /><br />

      <input
        placeholder="Skills (comma separated)"
        value={profile.skills}
        onChange={(e) =>
          setProfile({ ...profile, skills: e.target.value })
        }
      />

      <br /><br />

      <button onClick={handleUpdate}>Save</button>
    </div>
  );
};

export { default } from "./Profile";
