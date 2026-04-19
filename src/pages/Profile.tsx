
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

console.log("COMPONENT RENDERED");
console.log("PROFILE FILE LOADED 🚀");

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate(); // ✅ inside component

 useEffect(() => {
  const fetchProfile = async () => {

    const { data, error } = await supabase.auth.getSession();
    console.log("SESSION:", data);

    const user = data?.session?.user;

    if (!user) {
      console.log("❌ No user logged in");
      return;
    }

    console.log("✅ USER ID:", user.id);

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id);

    console.log("PROFILE DATA:", profileData);
    console.log("PROFILE ERROR:", profileError);

    if (profileData && profileData.length > 0) {
      setProfile(profileData[0]);
    } else {
      console.log("❌ No profile found in DB");
    }
  };

  fetchProfile();
}, []);

  if (!profile) {
    return <div className="text-white p-6">Loading profile...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white flex justify-center items-center">
      <div className="bg-gray-900 p-6 rounded-xl w-[400px]">

        {/* Avatar */}
        <div className="flex flex-col items-center">
          <img
            src={profile.avatar_url || "https://via.placeholder.com/100"}
            alt="avatar"
            className="w-24 h-24 rounded-full mb-4"
          />
          <h1 className="text-2xl font-bold">{profile.name}</h1>
          <p className="text-gray-400">{profile.email}</p>
        </div>

        {/* Bio */}
        <div className="mt-4">
          <p className="text-sm">{profile.bio || "No bio added"}</p>
        </div>

        {/* Skills */}
        <div className="mt-4">
          <h2 className="font-semibold mb-2">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills?.map((skill, i) => (
              <span key={i} className="bg-blue-600 px-3 py-1 rounded text-sm">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* ✅ Edit Button */}
        <button
          onClick={() => navigate("/edit-profile")}
          className="bg-blue-600 px-4 py-2 rounded mt-4 w-full"
        >
          Edit Profile
        </button>

      </div>
    </div>
  );
};

export default Profile;