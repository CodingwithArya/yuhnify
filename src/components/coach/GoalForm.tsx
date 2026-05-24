"use client";

import { useEffect, useState } from "react";
import type { CoachFormValues, OptimizingGoal } from "@/types/coach";

const DEFAULT_VALUES: CoachFormValues = {
  raceDate: "",
  goalTime: "",
  daysPerWeek: "3",
  additionalNotes: "",
  recentRaceDistance: "",
  recentRaceTime: "",
  recentRaceDate: "",
};

const RACE_DISTANCE_OPTIONS = [
  { value: "", label: "Select distance" },
  { value: "5k", label: "5K" },
  { value: "10k", label: "10K" },
  { value: "15k", label: "15K" },
  { value: "half", label: "Half marathon" },
  { value: "marathon", label: "Marathon" },
  { value: "other", label: "Other" },
];

function getRecentRaceValidation(values: CoachFormValues): string | null {
  const hasDate = Boolean(values.recentRaceDate?.trim());
  const hasDistance = Boolean(values.recentRaceDistance?.trim());
  const hasTime = Boolean(values.recentRaceTime?.trim());
  const anyFilled = hasDate || hasDistance || hasTime;
  const allFilled = hasDate && hasDistance && hasTime;
  if (anyFilled && !allFilled) {
    return "Add distance and time for the most accurate paces";
  }
  return null;
}

const GOAL_OPTIONS: {
  id: OptimizingGoal;
  title: string;
  subtitle: string;
  preview: string;
  optimizingFor: string;
}[] = [
  {
    id: "finish_strong",
    title: "Finish strong",
    subtitle: "Build endurance and consistency, avoid injury",
    preview: "We will prioritize easy volume and progressive long runs",
    optimizingFor: "Finish strong with injury prevention and endurance",
  },
  {
    id: "hit_goal",
    title: "Hit my goal time",
    subtitle: "Structured workouts, lactate threshold focus",
    preview: "Expect threshold work and race-specific sessions",
    optimizingFor: "Hit goal time with threshold and race-specific work",
  },
  {
    id: "run_faster",
    title: "Run faster overall",
    subtitle: "Speed development, VO2max work",
    preview: "Expect intervals and tempo runs with controlled easy days",
    optimizingFor: "Run faster overall with speed and VO2max development",
  },
  {
    id: "ai_decides",
    title: "I'm not sure, just make me a plan",
    subtitle: "AI decides based on your data",
    preview: "Claude will pick the best approach from your recent runs",
    optimizingFor: "Balanced plan based on current fitness data",
  },
];

interface GoalFormProps {
  userId: string;
  loading: boolean;
  disabled: boolean;
  onSubmit: (values: CoachFormValues) => void;
}

function goalsStorageKey(userId: string) {
  return `yuhnify-coach-goals-${userId}`;
}

export function GoalForm({
  userId,
  loading,
  disabled,
  onSubmit,
}: GoalFormProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [values, setValues] = useState<CoachFormValues>(DEFAULT_VALUES);
  const [selectedGoal, setSelectedGoal] = useState<OptimizingGoal | null>(null);
  const [customApproach, setCustomApproach] = useState("");
  const recentRaceHint = getRecentRaceValidation(values);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(goalsStorageKey(userId));
      if (stored) {
        setValues({ ...DEFAULT_VALUES, ...JSON.parse(stored) });
      }
    } catch {
      // ignore
    }
  }, [userId]);

  useEffect(() => {
    try {
      localStorage.setItem(goalsStorageKey(userId), JSON.stringify(values));
    } catch {
      // ignore
    }
  }, [userId, values]);

  function handleContinue(event: React.FormEvent) {
    event.preventDefault();
    setStep(2);
  }

  function handleGenerate() {
    const goalOption = GOAL_OPTIONS.find((g) => g.id === selectedGoal);
    onSubmit({
      ...values,
      optimizingFor: customApproach.trim()
        ? customApproach.trim()
        : goalOption?.optimizingFor ?? GOAL_OPTIONS[3].optimizingFor,
      customApproach: customApproach.trim() || undefined,
    });
  }

  if (loading) {
    return (
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-8 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-[#27272a] border-t-[#f97316] rounded-full animate-spin" />
        <p className="text-[#71717a] text-sm">Analyzing your runs...</p>
      </div>
    );
  }

  if (step === 2) {
    const preview =
      customApproach.trim() ||
      GOAL_OPTIONS.find((g) => g.id === selectedGoal)?.preview ||
      "";

    return (
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 space-y-4">
        <div>
          <h2 className="text-white font-medium">What are you optimizing for?</h2>
          <p className="text-xs text-[#71717a] mt-1">Pick one focus for this plan</p>
        </div>

        <div className="space-y-2">
          {GOAL_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() => setSelectedGoal(option.id)}
              className={`w-full text-left p-3 rounded-xl border transition-colors ${
                selectedGoal === option.id
                  ? "border-[#f97316] bg-[#f97316]/10"
                  : "border-[#27272a] bg-[#09090b] hover:border-[#27272a]/80"
              }`}
            >
              <p className="text-sm text-white font-medium">{option.title}</p>
              <p className="text-xs text-[#71717a] mt-0.5">{option.subtitle}</p>
            </button>
          ))}
        </div>

        {preview && !customApproach.trim() && selectedGoal && selectedGoal !== "ai_decides" && (
          <p className="text-xs text-[#71717a] bg-[#09090b] border border-[#27272a] rounded-lg p-3">
            {preview}
          </p>
        )}

        <div>
          <label htmlFor="custom-approach" className="block text-sm text-[#71717a] mb-1.5">
            Suggest a specific approach (optional)
          </label>
          <input
            id="custom-approach"
            type="text"
            placeholder="e.g. I want to follow 80/20 training"
            value={customApproach}
            disabled={disabled}
            onChange={(e) => setCustomApproach(e.target.value)}
            className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f97316] disabled:opacity-50"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="flex-1 py-3 rounded-xl border border-[#27272a] text-[#71717a] hover:text-white transition-colors"
          >
            Back
          </button>
          <button
            type="button"
            disabled={disabled || (!selectedGoal && !customApproach.trim())}
            onClick={handleGenerate}
            className="flex-1 py-3 rounded-xl bg-[#f97316] text-white font-semibold hover:bg-orange-400 transition-colors disabled:opacity-50"
          >
            Generate my plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleContinue}
      className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 space-y-4"
    >
      <div>
        <label htmlFor="race-date" className="block text-sm text-[#71717a] mb-1.5">
          Race date
        </label>
        <input
          id="race-date"
          type="date"
          value={values.raceDate}
          disabled={disabled}
          onChange={(e) => setValues((prev) => ({ ...prev, raceDate: e.target.value }))}
          className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f97316] disabled:opacity-50"
        />
      </div>

      <div>
        <label htmlFor="goal-time" className="block text-sm text-[#71717a] mb-1.5">
          Goal finish time
        </label>
        <input
          id="goal-time"
          type="text"
          placeholder="e.g. 2:00:00"
          value={values.goalTime}
          disabled={disabled}
          onChange={(e) => setValues((prev) => ({ ...prev, goalTime: e.target.value }))}
          className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f97316] disabled:opacity-50"
        />
      </div>

      <div>
        <label htmlFor="days-per-week" className="block text-sm text-[#71717a] mb-1.5">
          Days per week
        </label>
        <select
          id="days-per-week"
          value={values.daysPerWeek}
          disabled={disabled}
          onChange={(e) =>
            setValues((prev) => ({
              ...prev,
              daysPerWeek: e.target.value as CoachFormValues["daysPerWeek"],
            }))
          }
          className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f97316] disabled:opacity-50"
        >
          <option value="2">2 days</option>
          <option value="3">3 days</option>
          <option value="4">4 days</option>
        </select>
      </div>

      <div className="border-t border-[#27272a] pt-4 space-y-3">
        <div>
          <p className="text-sm text-white font-medium">Recent race result (optional)</p>
          <p className="text-xs text-[#71717a] mt-0.5">
            A recent race gives the most accurate paces
          </p>
        </div>
        <div className="space-y-3">
          <div>
            <label htmlFor="recent-race-date" className="block text-xs text-[#71717a] mb-1.5">
              When was it?
            </label>
            <input
              id="recent-race-date"
              type="date"
              value={values.recentRaceDate ?? ""}
              disabled={disabled}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, recentRaceDate: e.target.value }))
              }
              className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f97316] disabled:opacity-50"
            />
          </div>
          <div>
            <label htmlFor="recent-race-distance" className="block text-xs text-[#71717a] mb-1.5">
              Distance
            </label>
            <select
              id="recent-race-distance"
              value={values.recentRaceDistance ?? ""}
              disabled={disabled}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, recentRaceDistance: e.target.value }))
              }
              className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f97316] disabled:opacity-50"
            >
              {RACE_DISTANCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="recent-race-time" className="block text-xs text-[#71717a] mb-1.5">
              Finish time
            </label>
            <input
              id="recent-race-time"
              type="text"
              placeholder="e.g. 28:30"
              value={values.recentRaceTime ?? ""}
              disabled={disabled}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, recentRaceTime: e.target.value }))
              }
              className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f97316] disabled:opacity-50"
            />
          </div>
          {recentRaceHint && (
            <p className="text-xs text-[#f97316]/90">{recentRaceHint}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="coach-notes" className="block text-sm text-[#71717a] mb-1.5">
          Notes for coach (optional)
        </label>
        <textarea
          id="coach-notes"
          maxLength={300}
          rows={3}
          placeholder="e.g. left knee has been sore"
          value={values.additionalNotes}
          disabled={disabled}
          onChange={(e) =>
            setValues((prev) => ({ ...prev, additionalNotes: e.target.value }))
          }
          className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-[#f97316] disabled:opacity-50"
        />
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="w-full py-3 rounded-xl bg-[#f97316] text-white font-semibold hover:bg-orange-400 transition-colors disabled:opacity-50"
      >
        Continue
      </button>
    </form>
  );
}

export function getStoredGoalValues(userId: string): CoachFormValues {
  if (typeof window === "undefined") return DEFAULT_VALUES;
  try {
    const stored = localStorage.getItem(goalsStorageKey(userId));
    if (stored) return { ...DEFAULT_VALUES, ...JSON.parse(stored) };
  } catch {
    // ignore
  }
  return DEFAULT_VALUES;
}
