// src/components/ProfileCompletionBar.tsx

import React from "react";
import { Link } from "react-router-dom";
import {
  calculateProfileCompletion,
  getCompletionTier,
  type UserProfile,
} from "@/utils/profileCompletion";

interface ProfileCompletionBarProps {
  profile: UserProfile;
  profileEditBasePath?: string;
  className?: string;
}

const TIER_CONFIG = {
  low: {
    barClass: "bg-red-500",
    trackClass: "bg-red-100 dark:bg-red-950",
    badgeClass: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    message: "Complete your profile to get better peer matches.",
    icon: "⚠️",
  },
  medium: {
    barClass: "bg-yellow-400",
    trackClass: "bg-yellow-100 dark:bg-yellow-950",
    badgeClass:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
    message: "You're making progress — a few more fields and you'll stand out.",
    icon: "📋",
  },
  high: {
    barClass: "bg-green-500",
    trackClass: "bg-green-100 dark:bg-green-950",
    badgeClass:
      "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    message: "Almost there! Finishing up boosts your visibility to peers.",
    icon: "🎯",
  },
  complete: {
    barClass: "bg-green-500",
    trackClass: "bg-green-100 dark:bg-green-950",
    badgeClass:
      "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    message: "",
    icon: "🏆",
  },
};

export const ProfileCompletionBar: React.FC<ProfileCompletionBarProps> = ({
  profile,
  profileEditBasePath = "/profile/edit",
  className = "",
}) => {
  const { percentage, missingFields, isComplete } = calculateProfileCompletion(
    profile,
    profileEditBasePath
  );
  const tier = getCompletionTier(percentage);
  const config = TIER_CONFIG[tier];

  if (isComplete) {
    return (
      <div
        className={`flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-950/40 ${className}`}
        role="status"
        aria-label="Profile complete"
      >
        <span className="text-xl" aria-hidden="true">
          🏆
        </span>
        <div>
          <p className="text-sm font-semibold text-green-700 dark:text-green-300">
            Profile complete!
          </p>
          <p className="text-xs text-green-600 dark:text-green-400">
            Your profile is fully set up. Peers can discover you easily.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-border bg-card p-4 shadow-sm ${className}`}
      role="region"
      aria-label="Profile completion progress"
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-base" aria-hidden="true">
            {config.icon}
          </span>
          <span className="text-sm font-semibold text-foreground">
            Your profile is{" "}
            <span
              className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-bold ${config.badgeClass}`}
            >
              {percentage}% complete
            </span>
          </span>
        </div>
        <Link
          to={profileEditBasePath}
          className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Edit profile
        </Link>
      </div>

      <div
        className={`h-2.5 w-full overflow-hidden rounded-full ${config.trackClass}`}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${percentage}% profile complete`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${config.barClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {config.message && (
        <p className="mt-2 text-xs text-muted-foreground">{config.message}</p>
      )}

      {missingFields.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Missing fields">
          {missingFields.map((field) => (
            <Link
              key={field.key}
              to={field.editPath}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label={`Go to edit: ${field.label}`}
            >
              <span aria-hidden="true">+</span>
              {field.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfileCompletionBar;