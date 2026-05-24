import type { Units } from "@/lib/units";
import type { UserProfile } from "@/types/profile";
import { EMPTY_PROFILE } from "@/types/profile";
import { normalizeProfilePatch } from "@/lib/user-profile";

export type UserSettings = UserProfile;

const settingsMap = new Map<string, UserProfile>();

export function getUserSettings(userId: string): UserProfile {
  return settingsMap.get(userId) ?? { ...EMPTY_PROFILE, units: "mi" };
}

export function updateUserSettings(
  userId: string,
  patch: Partial<UserProfile> & { displayName?: string }
): UserProfile {
  const current = getUserSettings(userId);
  const normalized = normalizeProfilePatch(patch);
  const updated: UserProfile = {
    ...current,
    ...normalized,
    units: normalized.units ?? current.units,
    firstName:
      normalized.firstName !== undefined
        ? normalized.firstName
        : current.firstName,
  };
  settingsMap.set(userId, updated);
  return updated;
}
