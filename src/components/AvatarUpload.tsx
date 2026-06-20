import React, { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { API_BASE_URL } from "@/config/api";

type AvatarUploadProps = {
  currentAvatarUrl: string;
  onUploadSuccess: (url: string) => void;
  onUploadError: (error: string) => void;
};

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatarUrl,
  onUploadSuccess,
  onUploadError,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      onUploadError(
        "Please select a valid image file (JPG, PNG, GIF, or WebP)."
      );
      return;
    }

    // Client-side pre-check for 50MB (though backend enforces it as well)
    if (file.size > 50 * 1024 * 1024) {
      onUploadError(
        "Image is too large. Please upload an image smaller than 50MB."
      );
      return;
    }

    setIsUploading(true);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const user = session.data.session?.user;

      if (!user) {
        throw new Error(
          "You must be signed in before uploading a profile picture."
        );
      }

      const timestamp = Date.now();
      const filePath = `${user.id}/${timestamp}_avatar`;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "avatars");
      formData.append("filePath", filePath);

      const res = await fetch(`${API_BASE_URL}/api/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();

        if (res.status === 401) {
          throw new Error(
            "Your session has expired. Please sign in again and retry the upload."
          );
        }

        if (res.status === 413) {
          throw new Error(
            "Image is too large. Please upload an image smaller than 50MB."
          );
        }

        throw new Error(
          `Unable to upload your profile picture. Please try again. (${res.status})`
        );
      }

      const uploadResponse = await res.json();

      if (uploadResponse.success && uploadResponse.data?.url) {
        onUploadSuccess(uploadResponse.data.url);
      } else {
        throw new Error(
          "The server returned an unexpected response. Please try again."
        );
      }
    } catch (err: any) {
      onUploadError(
        err.message ||
          "Unable to upload your profile picture. Please try again later."
      );
    } finally {
      setIsUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="relative inline-block">
      <img
        src={currentAvatarUrl}
        alt="avatar"
        className="w-36 h-36 rounded-full border-4 border-cyan-400 object-cover shadow-2xl shadow-cyan-500/20"
      />

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="absolute bottom-2 right-2 bg-cyan-400 p-3 rounded-full hover:bg-cyan-300 transition-colors disabled:opacity-50"
      >
        {isUploading ? (
          <Loader2 size={20} className="text-black animate-spin" />
        ) : (
          <Camera size={20} className="text-black" />
        )}
      </button>
    </div>
  );
};