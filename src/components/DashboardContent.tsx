"use client";

import type { WeeklyStats } from "@/lib/dashboard-stats";
import type { ProcessedRun } from "@/types";
import { useUnits } from "@/components/UnitsGuard";
import { StatCards } from "@/components/StatCards";
import { CoachNudgeCard } from "@/components/CoachNudgeCard";
import { RecentRunsList } from "@/components/RecentRunsList";

interface DashboardContentProps {
  fetchFailed: boolean;
  weeklyStats: WeeklyStats;
  runs: ProcessedRun[];
}

export function DashboardContent({
  fetchFailed,
  weeklyStats,
  runs,
}: DashboardContentProps) {
  const { units } = useUnits();

  if (fetchFailed) {
    return (
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 text-center">
        <p className="text-[#71717a] text-sm">
          Could not load your runs. Try refreshing.
        </p>
      </div>
    );
  }

  return (
    <>
      <StatCards stats={weeklyStats} units={units} />
      <CoachNudgeCard />
      <RecentRunsList runs={runs} units={units} />
    </>
  );
}
