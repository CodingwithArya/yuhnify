import type { TrainingPlan } from "@/types";

interface StoredPreviousPlan {
  plan: TrainingPlan;
  generatedAt: string;
}

function previousPlanKey(userId: string): string {
  return `yuhnify-previous-plan-${userId}`;
}

export function savePreviousPlan(
  userId: string,
  plan: TrainingPlan,
  generatedAt: string
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      previousPlanKey(userId),
      JSON.stringify({ plan, generatedAt } satisfies StoredPreviousPlan)
    );
  } catch {
    // ignore
  }
}

export function loadPreviousPlan(userId: string): StoredPreviousPlan | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(previousPlanKey(userId));
    if (!raw) return null;
    return JSON.parse(raw) as StoredPreviousPlan;
  } catch {
    return null;
  }
}

export function clearPreviousPlan(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(previousPlanKey(userId));
  } catch {
    // ignore
  }
}
