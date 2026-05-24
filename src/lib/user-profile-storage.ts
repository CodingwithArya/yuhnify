import type { Units } from "@/lib/units";
import type { UserProfile } from "@/types/profile";
import { EMPTY_PROFILE } from "@/types/profile";
import { writeUnitsToStorage } from "@/lib/units";

const PROFILE_ROOT_KEY = "yuhnify_profile";

function profileKey(userId: string): string {
  return userId;
}

function readProfileRoot(): Record<string, UserProfile> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PROFILE_ROOT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, UserProfile>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeProfileRoot(root: Record<string, UserProfile>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROFILE_ROOT_KEY, JSON.stringify(root));
  } catch {
    // ignore
  }
}

export function readProfileFromStorage(userId: string): UserProfile {
  try {
    const root = readProfileRoot();
    const stored = root[profileKey(userId)];
    if (!stored) return { ...EMPTY_PROFILE };
    return { ...EMPTY_PROFILE, ...stored };
  } catch {
    return { ...EMPTY_PROFILE };
  }
}

export function writeProfileToStorage(
  userId: string,
  profile: UserProfile
): void {
  try {
    const root = readProfileRoot();
    root[profileKey(userId)] = profile;
    writeProfileRoot(root);
    writeUnitsToStorage(profile.units);
  } catch {
    // ignore
  }
}

export function onboardingCompleteKey(userId: string): string {
  return `yuhnify_onboarding_complete_${userId}`;
}

export function isOnboardingComplete(userId: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(onboardingCompleteKey(userId)) === "true";
  } catch {
    return false;
  }
}

export function setOnboardingComplete(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(onboardingCompleteKey(userId), "true");
  } catch {
    // ignore
  }
}

export function patchProfileInStorage(
  userId: string,
  patch: Partial<UserProfile>
): UserProfile {
  const current = readProfileFromStorage(userId);
  const updated = { ...current, ...patch };
  writeProfileToStorage(userId, updated);
  return updated;
}

export function syncUnitsFromProfile(userId: string): Units {
  const profile = readProfileFromStorage(userId);
  writeUnitsToStorage(profile.units);
  return profile.units;
}
