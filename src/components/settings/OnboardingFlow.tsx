"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Units } from "@/lib/units";
import type { UserProfile } from "@/types/profile";
import { EMPTY_PROFILE } from "@/types/profile";
import { writeUnitsToStorage } from "@/lib/units";
import {
  setOnboardingComplete,
  writeProfileToStorage,
} from "@/lib/user-profile-storage";
import { ProfileFields } from "@/components/profile/ProfileFields";
import { InjuryAutocomplete } from "@/components/profile/InjuryAutocomplete";
import { HealthConditionsFields } from "@/components/profile/HealthConditionsFields";

interface OnboardingFlowProps {
  userId: string;
  defaultFirstName: string;
}

type OnboardingStep = 1 | 2 | 3 | 4;

async function saveProfile(profile: UserProfile): Promise<boolean> {
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

export function OnboardingFlow({
  userId,
  defaultFirstName,
}: OnboardingFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>(1);
  const [units, setUnits] = useState<Units>("mi");
  const [profile, setProfile] = useState<UserProfile>({
    ...EMPTY_PROFILE,
    firstName: defaultFirstName,
    units: "mi",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  function patchProfile(patch: Partial<UserProfile>) {
    setProfile((prev) => ({ ...prev, ...patch }));
  }

  async function finishOnboarding(finalProfile: UserProfile) {
    setSaving(true);
    setError(false);
    const ok = await saveProfile(finalProfile);
    if (!ok) {
      setError(true);
      setSaving(false);
      return;
    }
    writeProfileToStorage(userId, finalProfile);
    writeUnitsToStorage(finalProfile.units);
    setOnboardingComplete(userId);
    router.push("/dashboard");
  }

  function handleStep1Continue() {
    if (!profile.firstName.trim()) return;
    patchProfile({ units });
    setStep(2);
  }

  function handleStep2Continue() {
    setStep(3);
  }

  function handleStep2Skip() {
    setStep(3);
  }

  function handleStep3Continue() {
    setStep(4);
  }

  function handleStep3Skip() {
    setStep(4);
  }

  function handleNoneOfTheseApply() {
    patchProfile({
      currentInjuries: undefined,
      healthConditions: undefined,
    });
    setStep(4);
  }

  function handleGetStarted() {
    const finalProfile: UserProfile = {
      ...profile,
      units,
      firstName: profile.firstName.trim() || defaultFirstName,
    };
    void finishOnboarding(finalProfile);
  }

  function handleSkipGoals() {
    const finalProfile: UserProfile = {
      ...profile,
      units,
      firstName: profile.firstName.trim() || defaultFirstName,
      primaryGoal: undefined,
    };
    void finishOnboarding(finalProfile);
  }

  const stepTitles: Record<OnboardingStep, string> = {
    1: "About you",
    2: "Running background",
    3: "Health and injuries",
    4: "Your goal",
  };

  return (
    <main className="px-4 py-8 md:px-6 max-w-md mx-auto">
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 space-y-5">
        <div>
          <p className="text-xs text-[#f97316] font-medium">
            Step {step} of 4
          </p>
          <h1 className="text-xl font-bold text-white mt-1">{stepTitles[step]}</h1>
          {step === 1 && (
            <p className="text-sm text-[#71717a] mt-2">
              You can change this anytime in settings.
            </p>
          )}
        </div>

        {step === 1 && (
          <div className="space-y-5">
            <ProfileFields
              profile={{ ...profile, units }}
              onChange={patchProfile}
              disabled={saving}
              variant="basic"
            />

            <div>
              <p className="block text-sm text-[#71717a] mb-2">
                Which units do you prefer?
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setUnits("mi")}
                  className={`py-3 rounded-full text-sm font-medium transition-colors disabled:opacity-50 ${
                    units === "mi"
                      ? "bg-[#f97316] text-white"
                      : "bg-zinc-800 text-white"
                  }`}
                >
                  Miles
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setUnits("km")}
                  className={`py-3 rounded-full text-sm font-medium transition-colors disabled:opacity-50 ${
                    units === "km"
                      ? "bg-[#f97316] text-white"
                      : "bg-zinc-800 text-white"
                  }`}
                >
                  Kilometers
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <ProfileFields
            profile={{ ...profile, units }}
            onChange={patchProfile}
            disabled={saving}
            variant="background"
          />
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-medium text-white">
                Any current injuries or physical limitations?
              </h2>
              <p className="text-xs text-[#71717a] mt-1">
                Your coach will avoid aggravating these
              </p>
              <div className="mt-3">
                <InjuryAutocomplete
                  value={profile.currentInjuries ?? []}
                  onChange={(currentInjuries) =>
                    patchProfile({
                      currentInjuries:
                        currentInjuries.length > 0 ? currentInjuries : undefined,
                    })
                  }
                  disabled={saving}
                  showHelperText={false}
                />
              </div>
            </div>

            <HealthConditionsFields
              value={profile.healthConditions}
              onChange={(healthConditions) =>
                patchProfile({ healthConditions })
              }
              disabled={saving}
              label="Any health conditions we should know about?"
              subtext="Helps your coach adjust training safely"
            />

            <button
              type="button"
              disabled={saving}
              onClick={handleNoneOfTheseApply}
              className="w-full py-2.5 rounded-xl border border-[#27272a] text-sm text-[#71717a] hover:text-white transition-colors disabled:opacity-50"
            >
              None of these apply
            </button>
          </div>
        )}

        {step === 4 && (
          <div>
            <input
              type="text"
              maxLength={200}
              placeholder="e.g. finish my first half marathon, run sub 2 hours, lose weight while training, just stay consistent this year"
              value={profile.primaryGoal ?? ""}
              disabled={saving}
              onChange={(e) => patchProfile({ primaryGoal: e.target.value })}
              className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f97316] disabled:opacity-50"
            />
            <p className="text-xs text-[#71717a] mt-2">
              Write anything. Your AI coach will read this directly.
            </p>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-400 text-center">
            Could not save profile. Try again.
          </p>
        )}

        <div className="flex gap-2 pt-1">
          {step > 1 && (
            <button
              type="button"
              disabled={saving}
              onClick={() => setStep((step - 1) as OnboardingStep)}
              className="flex-1 py-3 rounded-xl border border-[#27272a] text-[#71717a] hover:text-white transition-colors disabled:opacity-50"
            >
              Back
            </button>
          )}

          {step === 1 && (
            <button
              type="button"
              disabled={saving || !profile.firstName.trim()}
              onClick={handleStep1Continue}
              className="flex-1 py-3 rounded-xl bg-[#f97316] text-white font-semibold hover:bg-orange-400 transition-colors disabled:opacity-50"
            >
              Continue
            </button>
          )}

          {step === 2 && (
            <>
              <button
                type="button"
                disabled={saving}
                onClick={handleStep2Skip}
                className="flex-1 py-3 rounded-xl border border-[#27272a] text-[#71717a] hover:text-white transition-colors disabled:opacity-50"
              >
                Skip
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleStep2Continue}
                className="flex-1 py-3 rounded-xl bg-[#f97316] text-white font-semibold hover:bg-orange-400 transition-colors disabled:opacity-50"
              >
                Continue
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <button
                type="button"
                disabled={saving}
                onClick={handleStep3Skip}
                className="flex-1 py-3 rounded-xl border border-[#27272a] text-[#71717a] hover:text-white transition-colors disabled:opacity-50"
              >
                Skip
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleStep3Continue}
                className="flex-1 py-3 rounded-xl bg-[#f97316] text-white font-semibold hover:bg-orange-400 transition-colors disabled:opacity-50"
              >
                Continue
              </button>
            </>
          )}

          {step === 4 && (
            <>
              <button
                type="button"
                disabled={saving}
                onClick={handleSkipGoals}
                className="flex-1 py-3 rounded-xl border border-[#27272a] text-[#71717a] hover:text-white transition-colors disabled:opacity-50"
              >
                Skip
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleGetStarted}
                className="flex-1 py-3 rounded-xl bg-[#f97316] text-white font-semibold hover:bg-orange-400 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Get started"}
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
