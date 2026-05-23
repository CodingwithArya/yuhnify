import type { WeeklyStats } from "@/lib/dashboard-stats";

interface StatCardsProps {
  stats: WeeklyStats;
}

export function StatCards({ stats }: StatCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard label="Total km this week" value={`${stats.totalKm} km`} />
      <StatCard
        label="Avg pace this week"
        value={
          stats.avgPacePerKm === "--"
            ? "--"
            : `${stats.avgPacePerKm} /km`
        }
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
