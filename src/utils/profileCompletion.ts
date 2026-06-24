// src/utils/profileCompletion.ts

export interface UserProfile {
  avatar_url?: string | null;
  display_name?: string | null;
  bio?: string | null;
  skills?: string[] | null;
  learning_preferences?: string[] | null;
  github_url?: string | null;
  social_url?: string | null;
}

export interface ProfileField {
  key: string;
  label: string;
  weight: number;
  completed: boolean;
  editPath: string;
  editSection: string;
}

export interface ProfileCompletionResult {
  percentage: number;
  fields: ProfileField[];
  missingFields: ProfileField[];
  isComplete: boolean;
}

const FIELD_DEFINITIONS = [
  {
    key: "avatar_url",
    label: "Upload a profile photo",
    weight: 15,
    editSection: "photo",
  },
  {
    key: "display_name",
    label: "Add your display name",
    weight: 10,
    editSection: "name",
  },
  {
    key: "bio",
    label: "Write a bio",
    weight: 20,
    editSection: "bio",
  },
  {
    key: "skills",
    label: "Add at least 3 skills",
    weight: 25,
    editSection: "skills",
  },
  {
    key: "learning_preferences",
    label: "Set learning preferences",
    weight: 20,
    editSection: "preferences",
  },
  {
    key: "social_link",
    label: "Add a GitHub or social link",
    weight: 10,
    editSection: "links",
  },
] as const;

function isFieldCompleted(key: string, profile: UserProfile): boolean {
  switch (key) {
    case "avatar_url":
      return Boolean(profile.avatar_url);
    case "display_name":
      return Boolean(profile.display_name?.trim());
    case "bio":
      return Boolean(profile.bio?.trim() && profile.bio.trim().length >= 10);
    case "skills":
      return Array.isArray(profile.skills) && profile.skills.length >= 3;
    case "learning_preferences":
      return (
        Array.isArray(profile.learning_preferences) &&
        profile.learning_preferences.length > 0
      );
    case "social_link":
      return Boolean(profile.github_url?.trim() || profile.social_url?.trim());
    default:
      return false;
  }
}

export function calculateProfileCompletion(
  profile: UserProfile,
  profileEditBasePath = "/profile/edit"
): ProfileCompletionResult {
  const fields: ProfileField[] = FIELD_DEFINITIONS.map((def) => ({
    key: def.key,
    label: def.label,
    weight: def.weight,
    completed: isFieldCompleted(def.key, profile),
    editPath: `${profileEditBasePath}#${def.editSection}`,
    editSection: def.editSection,
  }));

  const percentage = fields
    .filter((f) => f.completed)
    .reduce((sum, f) => sum + f.weight, 0);

  const missingFields = fields.filter((f) => !f.completed);
  const isComplete = percentage === 100;

  return { percentage, fields, missingFields, isComplete };
}

export function getCompletionTier(
  percentage: number
): "low" | "medium" | "high" | "complete" {
  if (percentage === 100) return "complete";
  if (percentage >= 80) return "high";
  if (percentage >= 41) return "medium";
  return "low";
}