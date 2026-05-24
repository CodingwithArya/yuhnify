"use client";

import { useCallback, useEffect, useState } from "react";
import type { Units } from "@/lib/units";
import type { UserProfile } from "@/types/profile";
import { EMPTY_PROFILE } from "@/types/profile";
import { writeUnitsToStorage } from "@/lib/units";
import {
  readProfileFromStorage,
  writeProfileToStorage,
} from "@/lib/user-profile-storage";
import { ProfileFields } from "./ProfileFields";

interface ProfileEditorProps {
  userId: string;
  userEmail?: string;
  initialFirstName?: string;
}

async function saveProfileToApi(profile: UserProfile): Promise<boolean> {
  try {
    const response = await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function ProfileEditor({
  userId,
  userEmail,
  initialFirstName = "",
}: ProfileEditorProps) {
  const [profile, setProfile] = useState<UserProfile>({
    ...EMPTY_PROFILE,
    firstName: initialFirstName,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = readProfileFromStorage(userId);
    setProfile({
      ...EMPTY_PROFILE,
      ...stored,
      firstName: stored.firstName || initialFirstName,
    });
    setLoaded(true);

    void (async () => {
      try {
        const response = await fetch("/api/user");
        if (!response.ok) return;
        const data = (await response.json()) as UserProfile;
        const merged = {
          ...EMPTY_PROFILE,
          ...stored,
          ...data,
          firstName: data.firstName || stored.firstName || initialFirstName,
        };
        setProfile(merged);
        writeProfileToStorage(userId, merged);
        writeUnitsToStorage(merged.units);
      } catch {
        // ignore
      }
    })();
  }, [userId, initialFirstName]);

  const handleChange = useCallback((patch: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...patch }));
    setSaved(false);
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const ok = await saveProfileToApi(profile);
    if (ok) {
      writeProfileToStorage(userId, profile);
      writeUnitsToStorage(profile.units);
      setSaved(true);
    }
    setSaving(false);
  }

  async function handleBlurSave() {
    if (!loaded) return;
    const ok = await saveProfileToApi(profile);
    if (ok) {
      writeProfileToStorage(userId, profile);
      writeUnitsToStorage(profile.units);
    }
  }

  return (
    <div className="space-y-5">
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 space-y-4">
        <div>
          <h1 className="text-white font-semibold text-lg">Profile</h1>
          {userEmail && (
            <p className="text-sm text-[#71717a] mt-1">{userEmail}</p>
          )}
        </div>

        <div onBlur={handleBlurSave}>
          <ProfileFields profile={profile} onChange={handleChange} />
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="w-full py-3 rounded-xl bg-[#f97316] text-white font-semibold hover:bg-orange-400 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save profile"}
        </button>

        {saved && (
          <p className="text-xs text-green-400 text-center">Profile saved</p>
        )}
      </div>
    </div>
  );
}
