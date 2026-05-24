"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isOnboardingComplete } from "@/lib/user-profile-storage";
import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { OnboardingFlow } from "@/components/settings/OnboardingFlow";

interface SettingsContentProps {
  userId: string;
  userName: string;
  userEmail?: string;
}

export function SettingsContent({
  userId,
  userName,
  userEmail,
}: SettingsContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const wantsOnboarding = searchParams.get("onboarding") === "true";
  const [onboardingDone, setOnboardingDone] = useState(true);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const complete = isOnboardingComplete(userId);
    setOnboardingDone(complete);
    setChecked(true);

    if (wantsOnboarding && complete) {
      router.replace("/settings");
    }
  }, [userId, wantsOnboarding, router]);

  const showOnboarding = wantsOnboarding && !onboardingDone && checked;

  if (!checked) {
    return null;
  }

  if (showOnboarding) {
    return (
      <OnboardingFlow userId={userId} defaultFirstName={userName.split(" ")[0] ?? userName} />
    );
  }

  return (
    <main className="px-4 py-5 md:px-6 max-w-lg space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-[#71717a] mt-1">Manage your profile and preferences</p>
      </div>
      <ProfileEditor
        userId={userId}
        userEmail={userEmail}
        initialFirstName={userName.split(" ")[0] ?? userName}
      />
    </main>
  );
}
