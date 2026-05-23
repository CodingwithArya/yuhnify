import type { ProcessedRun } from "@/types";

interface RecentRunsListProps {
  runs: ProcessedRun[];
}

export function RecentRunsList({ runs }: RecentRunsListProps) {
  if (runs.length === 0) {
    return (
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 text-center">
        <p className="text-[#71717a] text-sm">
          No runs found. Log one on Strava and come back.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-[#71717a]">Recent runs</h2>
      <div className="space-y-2">
        {runs.map((run) => (
          <div
            key={run.id}
            className="bg-[#18181b] border border-[#27272a] rounded-xl p-4"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-white font-medium text-sm">{run.name}</p>
              <p className="text-xs text-[#71717a] shrink-0">{run.date}</p>
            </div>
            <p className="text-sm text-[#71717a]">
              {run.distanceKm} km · {run.durationMinutes} min · {run.pacePerKm}
              /km
              {run.avgHeartrate ? ` · ${run.avgHeartrate} bpm` : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
