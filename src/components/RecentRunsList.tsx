"use client";

import { useState } from "react";
import type { ProcessedRun } from "@/types";
import type { Units } from "@/lib/units";
import {
  formatDistance,
  formatPaceForUnits,
  kmToMiles,
} from "@/lib/units";

interface RecentRunsListProps {
  runs: ProcessedRun[];
  units: Units;
}

export function RecentRunsList({ runs, units }: RecentRunsListProps) {
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
          <RunCard key={run.id} run={run} defaultUnits={units} />
        ))}
      </div>
    </div>
  );
}

function RunCard({
  run,
  defaultUnits,
}: {
  run: ProcessedRun;
  defaultUnits: Units;
}) {
  const [cardUnits, setCardUnits] = useState<Units | null>(null);
  const displayUnits = cardUnits ?? defaultUnits;

  const distance =
    displayUnits === "mi"
      ? `${kmToMiles(run.distanceKm)} mi`
      : formatDistance(run.distanceKm, "km");

  const pace = formatPaceForUnits(run.pacePerKm, displayUnits);

  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-white font-medium text-sm">{run.name}</p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() =>
              setCardUnits((current) => {
                const active = current ?? defaultUnits;
                return active === "mi" ? "km" : "mi";
              })
            }
            className="text-xs px-2 py-0.5 rounded-full border border-[#27272a] text-[#71717a] hover:text-white"
          >
            {displayUnits}
          </button>
          <p className="text-xs text-[#71717a]">{run.date}</p>
        </div>
      </div>
      <p className="text-sm text-[#71717a]">
        {distance} · {run.durationMinutes} min · {pace}
        {run.avgHeartrate ? ` · ${run.avgHeartrate} bpm` : ""}
      </p>
    </div>
  );
}
