import type { StravaActivity } from "@/types";

export interface WeeklyStats {
  totalKm: number;
  avgPacePerKm: string;
  runCount: number;
  avgHeartRate: string;
}

function getMondayMidnightLocal(): Date {
  const now = new Date();
  const monday = new Date(now);
  const day = now.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  monday.setDate(now.getDate() - daysSinceMonday);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function formatPace(secsPerKm: number): string {
  if (secsPerKm === 0) return "--";
  const mins = Math.floor(secsPerKm / 60);
  const secs = Math.round(secsPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function computeWeeklyStats(activities: StravaActivity[]): WeeklyStats {
  const weekStart = getMondayMidnightLocal();
  const now = new Date();

  const weekRuns = activities.filter((activity) => {
    if (activity.type !== "Run") return false;
    const start = new Date(activity.start_date);
    return start >= weekStart && start <= now;
  });

  const totalKm =
    Math.round(
      (weekRuns.reduce((sum, run) => sum + run.distance, 0) / 1000) * 10
    ) / 10;

  const totalMovingTime = weekRuns.reduce(
    (sum, run) => sum + run.moving_time,
    0
  );
  const totalDistanceKm = weekRuns.reduce(
    (sum, run) => sum + run.distance / 1000,
    0
  );
  const avgPacePerKm =
    totalDistanceKm > 0
      ? formatPace(totalMovingTime / totalDistanceKm)
      : "--";

  const runsWithHr = weekRuns.filter((run) => run.average_heartrate);
  const avgHeartRate =
    runsWithHr.length > 0
      ? String(
          Math.round(
            runsWithHr.reduce(
              (sum, run) => sum + (run.average_heartrate ?? 0),
              0
            ) / runsWithHr.length
          )
        )
      : "--";

  return {
    totalKm,
    avgPacePerKm,
    runCount: weekRuns.length,
    avgHeartRate,
  };
}
