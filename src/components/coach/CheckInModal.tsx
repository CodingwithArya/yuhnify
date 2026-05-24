"use client";

import { useEffect, useState } from "react";
import type { PlannedRun } from "@/types";
import type { PainLevel, PainLocation } from "@/types/profile";
import {
  loadCheckIn,
  saveCheckInLocal,
  type StoredCheckIn,
} from "@/lib/checkin-local";

interface CheckInModalProps {
  run: PlannedRun;
  planWeek: string;
  planId: string;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: {
    day: string;
    runType: string;
    distanceKm: number;
    feeling: string;
    completed: string;
    notes?: string;
    painLevel: PainLevel;
    painLocations?: PainLocation[];
    planWeek: string;
  }) => void;
}

const FEELINGS = ["Very hard", "Hard", "Ok", "Easy", "Very easy"];
const COMPLETED = ["Yes", "Partial", "No"];
const PAIN_LEVELS: { value: PainLevel; label: string }[] = [
  { value: "none", label: "None" },
  { value: "mild", label: "Mild - did not affect run" },
  { value: "moderate", label: "Moderate - affected my pace or distance" },
  { value: "severe", label: "Severe - had to cut it short" },
];
const PAIN_LOCATIONS: { value: PainLocation; label: string }[] = [
  { value: "knee", label: "Knee" },
  { value: "shin", label: "Shin" },
  { value: "calf_achilles", label: "Calf or Achilles" },
  { value: "heel_arch", label: "Heel or arch" },
  { value: "hip", label: "Hip" },
  { value: "hamstring", label: "Hamstring" },
  { value: "ankle", label: "Ankle" },
  { value: "lower_back", label: "Lower back" },
  { value: "other", label: "Other" },
];

export function CheckInModal({
  run,
  planWeek,
  planId,
  userId,
  isOpen,
  onClose,
  onSave,
}: CheckInModalProps) {
  const [feeling, setFeeling] = useState("");
  const [completed, setCompleted] = useState("");
  const [notes, setNotes] = useState("");
  const [painLevel, setPainLevel] = useState<PainLevel>("none");
  const [painLocations, setPainLocations] = useState<PainLocation[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const existing = loadCheckIn(userId, planId, run.day);
    if (existing) {
      setFeeling(existing.feeling);
      setCompleted(existing.completed);
      setNotes(existing.notes ?? "");
      setPainLevel(existing.painLevel ?? "none");
      setPainLocations(existing.painLocations ?? []);
    } else {
      setFeeling("");
      setCompleted("");
      setNotes("");
      setPainLevel("none");
      setPainLocations([]);
    }
  }, [isOpen, userId, planId, run.day]);

  if (!isOpen) return null;

  function togglePainLocation(location: PainLocation) {
    setPainLocations((prev) =>
      prev.includes(location)
        ? prev.filter((l) => l !== location)
        : [...prev, location]
    );
  }

  function handlePainLevelChange(level: PainLevel) {
    setPainLevel(level);
    if (level === "none") {
      setPainLocations([]);
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!feeling || !completed) return;
    if (painLevel !== "none" && painLocations.length === 0) return;

    const payload = {
      day: run.day,
      runType: run.type,
      distanceKm: run.distanceKm,
      feeling,
      completed,
      notes: notes.trim() || undefined,
      painLevel,
      painLocations:
        painLevel !== "none" && painLocations.length > 0
          ? painLocations
          : undefined,
      planWeek,
    };

    const stored: StoredCheckIn = {
      feeling,
      completed,
      notes: notes.trim() || undefined,
      painLevel,
      painLocations:
        painLevel !== "none" && painLocations.length > 0
          ? painLocations
          : undefined,
    };

    try {
      saveCheckInLocal(userId, planId, run.day, stored);
    } catch {
      // ignore local save errors
    }

    onClose();
    onSave(payload);
  }

  const showPainLocations = painLevel !== "none";

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/60">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-[#18181b] border border-[#27272a] rounded-xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm">Log {run.day}</h2>
          <button type="button" onClick={onClose} className="text-[#71717a] text-sm">
            Close
          </button>
        </div>

        <div>
          <p className="text-xs text-[#71717a] mb-2">How did it feel?</p>
          <div className="flex flex-wrap gap-2">
            {FEELINGS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFeeling(option)}
                className={`text-xs px-2.5 py-1 rounded-full border ${
                  feeling === option
                    ? "border-[#f97316] text-[#f97316]"
                    : "border-[#27272a] text-[#71717a]"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-[#71717a] mb-2">Any pain or discomfort?</p>
          <div className="flex flex-col gap-2">
            {PAIN_LEVELS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handlePainLevelChange(option.value)}
                className={`text-xs px-3 py-2 rounded-lg border text-left ${
                  painLevel === option.value
                    ? "border-[#f97316] text-[#f97316]"
                    : "border-[#27272a] text-[#71717a]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {showPainLocations && (
          <div>
            <p className="text-xs text-[#71717a] mb-2">Where?</p>
            <div className="flex flex-wrap gap-2">
              {PAIN_LOCATIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => togglePainLocation(option.value)}
                  className={`text-xs px-2.5 py-1 rounded-full border ${
                    painLocations.includes(option.value)
                      ? "border-[#f97316] text-[#f97316]"
                      : "border-[#27272a] text-[#71717a]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs text-[#71717a] mb-2">Did you complete it?</p>
          <div className="flex gap-2">
            {COMPLETED.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setCompleted(option)}
                className={`text-xs px-3 py-1 rounded-full border ${
                  completed === option
                    ? "border-[#f97316] text-[#f97316]"
                    : "border-[#27272a] text-[#71717a]"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="checkin-notes" className="block text-xs text-[#71717a] mb-1.5">
            Notes (optional)
          </label>
          <textarea
            id="checkin-notes"
            maxLength={150}
            rows={2}
            placeholder="e.g. legs felt heavy"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-[#f97316]"
          />
        </div>

        <button
          type="submit"
          disabled={
            !feeling ||
            !completed ||
            (painLevel !== "none" && painLocations.length === 0)
          }
          className="w-full py-2.5 rounded-lg bg-[#f97316] text-white text-sm font-medium disabled:opacity-50"
        >
          Save
        </button>
      </form>
    </div>
  );
}
