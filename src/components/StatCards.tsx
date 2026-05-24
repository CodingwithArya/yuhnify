"use client";

import type { WeeklyStats } from "@/lib/dashboard-stats";
import type { Units } from "@/lib/units";
import { formatPaceForUnits } from "@/lib/units";

interface StatCardsProps {
  stats: WeeklyStats;
  units: Units;
}

export function StatCards({ stats, units }: StatCardsProps) {
  const distanceLabel = units === "mi" ? "Total mi this week" : "Total km this week";
  const distanceValue =
    units === "mi"
      ? `${Math.round(stats.totalKm * 0.621371 * 10) / 10} mi`
      : `${stats.totalKm} km`;

  const paceValue =
    stats.avgPacePerKm === "--"
      ? "--"
      : formatPaceForUnits(`${stats.avgPacePerKm}/km`, units);

  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard label={distanceLabel} value={distanceValue} />
      <StatCard
        label="Avg pace this week"
        value={paceValue === "--" ? "--" : paceValue}
      />
      <StatCard label="Runs this week" value={String(stats.runCount)} />
      <StatCard
        label="Avg heart rate"
        value={
          stats.avgHeartRate === "--"
            ? "--"
            : `${stats.avgHeartRate} bpm`
        }
      />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4">
      <p className="text-xs text-[#71717a] mb-1">{label}</p>
      <p className="text-xl font-semibold text-white">{value}</p>
    </div>
  );
}
