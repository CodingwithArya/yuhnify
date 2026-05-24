import { describe, expect, it } from "vitest";
import type { ProcessedRun } from "@/types";
import {
  computeTrainingZones,
  formatPace,
  paceFromComfortableSecs,
  tanakaMaxHr,
} from "@/lib/training-zones";

function makeRun(
  distanceKm: number,
  pacePerKm: string,
  overrides: Partial<ProcessedRun> = {}
): ProcessedRun {
  return {
    id: 1,
    name: "Test Run",
    date: "Mon, Jan 1",
    distanceKm,
    distanceMiles: distanceKm * 0.621371,
    durationMinutes: 30,
    pacePerKm,
    pacePerMile: "10:00",
    elevationGainM: 0,
    ...overrides,
  };
}

function paceToSecs(pace: string): number {
  const base = pace.replace(/\/(km|mi).*$/i, "").trim();
  const [mins, secs] = base.split(":").map(Number);
  return mins * 60 + secs;
}

describe("training zones pace multipliers", () => {
  const comfortableSecsPerMi = 600;
  const comfortableSecsPerKm = comfortableSecsPerMi / 1.60934;

  it("easy pace is 10% slower than comfortable pace", () => {
    const easy = paceFromComfortableSecs(comfortableSecsPerKm, 1.1, "mi");
    expect(paceToSecs(easy)).toBe(660);
  });

  it("tempo pace is 8% faster than comfortable pace", () => {
    const tempo = paceFromComfortableSecs(comfortableSecsPerKm, 0.92, "mi");
    expect(paceToSecs(tempo)).toBe(552);
  });

  it("interval pace is 15% faster than comfortable pace", () => {
    const interval = paceFromComfortableSecs(comfortableSecsPerKm, 0.85, "mi");
    expect(paceToSecs(interval)).toBe(510);
  });
});

describe("computeTrainingZones qualifying runs", () => {
  it("returns confident false with fewer than 3 qualifying runs", () => {
    const runs = [
      makeRun(5, "6:00", { id: 1 }),
      makeRun(4, "6:10", { id: 2 }),
    ];
    const result = computeTrainingZones(runs, "mi");
    expect(result.confident).toBe(false);
  });

  it("filters runs faster than 4:00/km", () => {
    const runs = [
      makeRun(5, "3:30", { id: 1 }),
      makeRun(5, "3:45", { id: 2 }),
      makeRun(5, "3:50", { id: 3 }),
      makeRun(5, "6:00", { id: 4 }),
    ];
    const result = computeTrainingZones(runs, "km");
    expect(result.confident).toBe(false);
    expect(result.qualifyingRunCount).toBe(0);
  });

  it("returns confident false for empty array", () => {
    const result = computeTrainingZones([], "mi");
    expect(result.confident).toBe(false);
    expect(result.easyPace).toBe("--");
  });

  it("returns confident false when all runs filtered out", () => {
    const runs = [
      makeRun(2, "5:00", { id: 1 }),
      makeRun(2, "5:30", { id: 2 }),
      makeRun(1, "4:30", { id: 3 }),
    ];
    const result = computeTrainingZones(runs, "km");
    expect(result.confident).toBe(false);
  });
});

describe("tanakaMaxHr", () => {
  it("computes 208 - (0.7 * age)", () => {
    expect(tanakaMaxHr(20)).toBe(194);
    expect(tanakaMaxHr(50)).toBe(173);
    expect(tanakaMaxHr(65)).toBe(162.5);
  });
});

describe("formatPace", () => {
  it("returns M:SS for seconds input", () => {
    expect(formatPace(600)).toBe("10:00");
    expect(formatPace(390)).toBe("6:30");
    expect(formatPace(552)).toBe("9:12");
  });
});

describe("race result path", () => {
  it("sets noRaceResult false when race provided", () => {
    const result = computeTrainingZones([], "mi", {
      recentRaceDistance: "5k",
      recentRaceTime: "25:00",
    });
    expect(result.noRaceResult).toBe(false);
    expect(result.confident).toBe(true);
  });
});
