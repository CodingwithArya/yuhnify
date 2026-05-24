import type { PlannedRun } from "@/types";

const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function truncateWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text.trim();
  return `${words.slice(0, maxWords).join(" ")}...`;
}

export function truncateSentences(text: string, maxSentences: number): string {
  const parts = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
  if (!parts) return text.trim();
  return parts.slice(0, maxSentences).join(" ").trim();
}

export function getDayIndex(day: string): number {
  const normalized = day.trim().toLowerCase();
  return DAY_ORDER.findIndex((d) => d.toLowerCase().startsWith(normalized));
}

export function hasDayPassed(day: string): boolean {
  const index = getDayIndex(day);
  if (index === -1) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentDayIndex = today.getDay();
  const mondayBasedToday = currentDayIndex === 0 ? 6 : currentDayIndex - 1;

  return index < mondayBasedToday;
}

export function getCurrentPlanWeek(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7
  );
  return `${now.getFullYear()}-W${week}`;
}

export interface DayChange {
  day: string;
  modified: boolean;
  diffs: string[];
}

export function comparePlanRuns(
  before: PlannedRun[],
  after: PlannedRun[]
): DayChange[] {
  return after.map((afterRun) => {
    const beforeRun = before.find(
      (r) => r.day.toLowerCase() === afterRun.day.toLowerCase()
    );
    const diffs: string[] = [];

    if (!beforeRun) {
      return { day: afterRun.day, modified: true, diffs: ["New workout"] };
    }

    if (beforeRun.type !== afterRun.type) {
      diffs.push(`${beforeRun.type} → ${afterRun.type}`);
    }
    if (beforeRun.distanceKm !== afterRun.distanceKm) {
      diffs.push(`${beforeRun.distanceKm}km → ${afterRun.distanceKm}km`);
    }
    if ((beforeRun.targetPace ?? "") !== (afterRun.targetPace ?? "")) {
      const from = beforeRun.targetPace ?? "none";
      const to = afterRun.targetPace ?? "none";
      diffs.push(`${from} → ${to}`);
    }

    return {
      day: afterRun.day,
      modified: diffs.length > 0,
      diffs,
    };
  });
}
