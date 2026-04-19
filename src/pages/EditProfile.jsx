import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

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
    await supabase
      .from("profiles")
      .update({
        name: profile.name,
        bio: profile.bio,
        skills: profile.skills
          ? profile.skills.split(",").map(s => s.trim())
          : [],
      })
      .eq("id", userId);

    alert("Updated!");
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

export default EditProfile;