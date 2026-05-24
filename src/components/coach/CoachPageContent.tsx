"use client";

import { useCallback, useEffect, useState } from "react";
import type { ProcessedRun, TrainingPlan } from "@/types";
import type { CoachFormValues } from "@/types/coach";
import { computeWeekSubtitle } from "@/lib/coach-utils";
import { comparePlanRuns, getCurrentPlanWeek, type DayChange } from "@/lib/plan-utils";
import {
  clearPreviousPlan,
  loadPreviousPlan,
  savePreviousPlan,
} from "@/lib/plan-undo-store";
import { useUnits } from "@/components/UnitsGuard";
import { readProfileFromStorage } from "@/lib/user-profile-storage";
import { collectCheckInNotesForPlan } from "@/lib/checkin-local";
import type { InjuryAlert } from "@/lib/injury-intelligence";
import { ActiveInjuryAlerts } from "./ActiveInjuryAlerts";
import { GoalForm, getStoredGoalValues } from "./GoalForm";
import { TrainingPlanDisplay } from "./TrainingPlanDisplay";

interface StoredPlan {
  plan: TrainingPlan;
  generatedAt: string;
}

interface CoachPageContentProps {
  userId: string;
  runs: ProcessedRun[];
}

function planStorageKey(userId: string) {
  return `yuhnify-coach-plan-${userId}`;
}

export function CoachPageContent({ userId, runs }: CoachPageContentProps) {
  const { units } = useUnits();
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [subtitle, setSubtitle] = useState("Set your race goal below");
  const [changedDays, setChangedDays] = useState<DayChange[]>([]);
  const [showChanges, setShowChanges] = useState(false);
  const [adjustmentBanner, setAdjustmentBanner] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [injuryAlerts, setInjuryAlerts] = useState<InjuryAlert[]>([]);
  const planWeek = getCurrentPlanWeek();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(planStorageKey(userId));
      if (stored) {
        const parsed = JSON.parse(stored) as StoredPlan;
        setPlan(parsed.plan);
        setGeneratedAt(parsed.generatedAt);
      }
      setCanUndo(loadPreviousPlan(userId) !== null);
    } catch {
      // ignore
    }
    setSubtitle(computeWeekSubtitle(getStoredGoalValues(userId).raceDate));
  }, [userId]);

  const persistPlan = useCallback(
    (newPlan: TrainingPlan, timestamp: string) => {
      setPlan(newPlan);
      setGeneratedAt(timestamp);
      try {
        localStorage.setItem(
          planStorageKey(userId),
          JSON.stringify({ plan: newPlan, generatedAt: timestamp })
        );
      } catch {
        // ignore
      }
    },
    [userId]
  );

  async function callCoachApi(
    values: CoachFormValues,
    extras?: { feedback?: string; previousPlan?: TrainingPlan }
  ) {
    setLoading(true);
    setError(false);
    setSubtitle(computeWeekSubtitle(values.raceDate));

    const storedProfile = readProfileFromStorage(userId);
    const checkInNotes = generatedAt
      ? collectCheckInNotesForPlan(userId, generatedAt)
      : [];

    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raceDate: values.raceDate || undefined,
          goalTime: values.goalTime || undefined,
          daysPerWeek: Number(values.daysPerWeek),
          additionalNotes: values.additionalNotes || undefined,
          optimizingFor: values.optimizingFor,
          customApproach: values.customApproach,
          recentRaceDistance: values.recentRaceDistance || undefined,
          recentRaceTime: values.recentRaceTime || undefined,
          recentRaceDate: values.recentRaceDate || undefined,
          feedback: extras?.feedback,
          previousPlan: extras?.previousPlan,
          units: storedProfile.units ?? units,
          checkInNotes,
          profile: {
            age: storedProfile.age,
            biologicalSex: storedProfile.biologicalSex,
            runningExperience: storedProfile.runningExperience,
            currentWeeklyMileage: storedProfile.currentWeeklyMileage,
            previousRace: storedProfile.previousRace,
            primaryGoal: storedProfile.primaryGoal,
            units: storedProfile.units ?? units,
            perinatalStatus: storedProfile.perinatalStatus,
            healthConditions: storedProfile.healthConditions,
            currentInjuries: storedProfile.currentInjuries,
          },
        }),
      });

      if (!response.ok) throw new Error("Generation failed");

      const data = (await response.json()) as {
        plan: TrainingPlan;
        generatedAt: string;
        injuryAlerts?: InjuryAlert[];
      };

      persistPlan(data.plan, data.generatedAt);
      setInjuryAlerts(data.injuryAlerts ?? []);
      setChangedDays([]);
      setShowChanges(false);
      clearPreviousPlan(userId);
      setCanUndo(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegenerateWithFeedback(feedback: string) {
    if (!plan) return;
    const values = getStoredGoalValues(userId);
    await callCoachApi(values, { feedback, previousPlan: plan });
  }

  function handleCheckIn(payload: {
    day: string;
    runType: string;
    distanceKm: number;
    feeling: string;
    completed: string;
    notes?: string;
    painLevel: "none" | "mild" | "moderate" | "severe";
    painLocations?: string[];
    planWeek: string;
  }) {
    void (async () => {
      try {
        const response = await fetch("/api/coach/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            currentPlan: plan,
            units,
          }),
        });

        if (!response.ok) return;

        const data = (await response.json()) as {
          adjusted: boolean;
          plan?: TrainingPlan;
          changedDays?: string[];
        };

        if (data.adjusted && data.plan && generatedAt && plan) {
          savePreviousPlan(userId, plan, generatedAt);
          setCanUndo(true);
          const changes = comparePlanRuns(plan.runs, data.plan.runs).filter(
            (c) => c.modified
          );
          persistPlan(data.plan, generatedAt);
          setChangedDays(changes);
          setShowChanges(false);
          setAdjustmentBanner(true);
        }
      } catch {
        // ignore background check-in errors
      }
    })();
  }

  function handleUndoAdjustment() {
    const previous = loadPreviousPlan(userId);
    if (!previous) return;

    persistPlan(previous.plan, previous.generatedAt);
    clearPreviousPlan(userId);
    setCanUndo(false);
    setChangedDays([]);
    setShowChanges(false);
    setAdjustmentBanner(false);
  }

  function handlePlanChange(updatedPlan: TrainingPlan) {
    if (generatedAt) persistPlan(updatedPlan, generatedAt);
    else setPlan(updatedPlan);
  }

  return (
    <main className="px-4 py-5 md:px-6 max-w-5xl">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-white">Coach</h1>
        <p className="text-sm text-[#71717a] mt-1">{subtitle}</p>
        {runs.length === 0 && (
          <p className="text-xs text-[#71717a] mt-2">
            No recent runs found. Your plan will be based on general guidance.
          </p>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
          <p className="text-sm text-red-300">
            Could not generate plan. Try again.
          </p>
        </div>
      )}

      <ActiveInjuryAlerts userId={userId} alerts={injuryAlerts} />

      <div className="md:grid md:grid-cols-2 md:gap-6 md:items-start space-y-5 md:space-y-0">
        <GoalForm
          userId={userId}
          loading={loading}
          disabled={loading}
          onSubmit={(values) => callCoachApi(values)}
        />

        {plan && generatedAt && !loading && (
          <TrainingPlanDisplay
            userId={userId}
            plan={plan}
            generatedAt={generatedAt}
            units={units}
            planWeek={planWeek}
            dayChanges={changedDays}
            showChanges={showChanges}
            onShowChanges={() => setShowChanges(true)}
            onRegenerateWithFeedback={handleRegenerateWithFeedback}
            onPlanChange={handlePlanChange}
            onCheckIn={handleCheckIn}
            adjustmentBanner={adjustmentBanner}
            onDismissBanner={() => setAdjustmentBanner(false)}
            onUndoAdjustment={handleUndoAdjustment}
            canUndo={canUndo}
          />
        )}
      </div>
    </main>
  );
}
