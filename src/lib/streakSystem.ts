/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * streakSystem.ts
 *
 * Supabase-backed streak and XP system.
 * All streak state is stored server-side in the profiles table —
 * server-authoritative, persistent across devices, and not manipulable
 * via browser DevTools.
 *
 * localStorage is used only as a read-cache for instant UI rendering.
 * It is always reconciled against the server on load.
 */

import { supabase } from "@/integrations/supabase/client";

// ── Local cache keys (read-only cache, never source of truth) ──
const CACHE_KEY = "pl_streak_cache";

export interface StreakData {
  streak: number;
  lastActive: string;
  totalXP: number;
  dailyXP: number;
  canRestore: boolean;
  restorationUsedToday: boolean;
}

export const getTodayKey = (): string => {
  return new Date().toISOString().slice(0, 10);
};

export const calculateStreakXP = (streak: number): number => {
  const baseXP = 50;
  const xpPerLevel = 10;
  const maxXP = 200;
  return Math.min(baseXP + streak * xpPerLevel, maxXP);
};

// ── Cache helpers ──────────────────────────────────────────────
function writeCache(data: StreakData): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

function readCache(): StreakData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as StreakData) : null;
  } catch {
    return null;
  }
}

function clearCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch { /* ignore */ }
}

// ── Auth helper ────────────────────────────────────────────────
async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

// ── Server read ────────────────────────────────────────────────
/**
 * Fetch streak data from Supabase and update local cache.
 * Falls back to cache if offline or unauthenticated.
 */
export async function getStreakData(): Promise<StreakData> {
  const today = getTodayKey();

  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("streak, last_active, points, restoration_used_today, restoration_date")
      .eq("id", userId)
      .single();

    if (error || !profile) throw error ?? new Error("No profile");

    const streak = profile.streak ?? 0;
    const lastActive = profile.last_active ?? "";
    const totalXP = profile.points ?? 0;
    const restorationUsed = profile.restoration_used_today ?? false;
    const restorationDate = profile.restoration_date ?? "";

    const canRestore = !restorationUsed || restorationDate !== today;
    const restorationUsedToday = restorationUsed && restorationDate === today;

    const result: StreakData = {
      streak,
      lastActive,
      totalXP,
      dailyXP: calculateStreakXP(streak),
      canRestore,
      restorationUsedToday,
    };

    writeCache(result);
    return result;
  } catch {
    // Fall back to cache for offline/unauthenticated scenarios
    return readCache() ?? {
      streak: 0,
      lastActive: "",
      totalXP: 0,
      dailyXP: 50,
      canRestore: true,
      restorationUsedToday: false,
    };
  }
}

// ── Server write ───────────────────────────────────────────────
/**
 * Update the daily streak in Supabase.
 * Called on login / daily visit.
 */
export async function updateDailyStreak(): Promise<{ streak: number; xpEarned: number }> {
  try {
    const { data, error } = await (supabase as any).rpc("update_daily_streak");
    if (error) throw error;

    // Invalidate cache so next getStreakData() fetches fresh data
    clearCache();

    return { streak: data.streak, xpEarned: data.xpEarned };
  } catch {
    return { streak: 0, xpEarned: 0 };
  }
}

/**
 * Restore a broken streak by spending 100 XP.
 * Both XP deduction and streak increment are atomic (single DB update).
 */
export async function restoreStreak(): Promise<{
  success: boolean;
  message: string;
  newStreak?: number;
}> {
  try {
    const { data, error } = await (supabase as any).rpc("restore_user_streak");
    if (error) throw error;

    if (data.success) {
      clearCache();
    }

    return {
      success: data.success,
      message: data.message,
      newStreak: data.newStreak,
    };
  } catch {
    return {
      success: false,
      message: "Failed to restore streak. Please try again.",
    };
  }
}

/**
 * Reset all streak data for the current user (server + cache).
 */
export async function resetStreak(): Promise<void> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return;

    await supabase
      .from("profiles")
      .update({
        streak: 0,
        last_active: null,
        restoration_used_today: false,
        restoration_date: null,
      })
      .eq("id", userId);

    clearCache();
  } catch { /* ignore */ }
}

// ── Pure utility functions (no storage) ───────────────────────
export const getStreakMilestone = (
  streak: number
): {
  level: string;
  emoji: string;
  nextMilestone: number;
  progress: number;
  reward?: string;
} => {
  if (streak >= 365) {
    return { level: "Legendary", emoji: "🏆", nextMilestone: 730, progress: 100, reward: "Unlocked: Yearly Badge" };
  }
  if (streak >= 100) {
    return { level: "Master", emoji: "👑", nextMilestone: 365, progress: Math.floor((streak / 365) * 100), reward: "100 Bonus XP every 7 days" };
  }
  if (streak >= 30) {
    return { level: "Elite", emoji: "⭐", nextMilestone: 100, progress: Math.floor((streak / 100) * 100), reward: "50 Bonus XP on day 30" };
  }
  if (streak >= 7) {
    return { level: "Rising Star", emoji: "🌟", nextMilestone: 30, progress: Math.floor((streak / 30) * 100), reward: "Weekly achievement badge" };
  }
  return { level: "Beginner", emoji: "🌱", nextMilestone: 7, progress: Math.floor((streak / 7) * 100), reward: "First week milestone" };
};

export const getStreakAchievements = (streak: number): string[] => {
  const achievements: string[] = [];
  if (streak >= 1) achievements.push("First Step 🌱");
  if (streak >= 3) achievements.push("3-Day Learner 📚");
  if (streak >= 7) achievements.push("Weekly Champion 🌟");
  if (streak >= 14) achievements.push("Fortnite Hero 💪");
  if (streak >= 30) achievements.push("Monthly Master ⭐");
  if (streak >= 100) achievements.push("Century Scholar 👑");
  if (streak >= 365) achievements.push("Legendary Guardian 🏆");
  return achievements;
};
