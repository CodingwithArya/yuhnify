import { describe, expect, it } from "vitest";
import type { ProcessedRun } from "@/types";
import {
  computeTrainingZones,
  formatPace,
  paceFromComfortableSecs,
  tanakaMaxHr,
} from "@/lib/training-zones";

const COMFORTABLE_SECS_PER_MI = 600;
const COMFORTABLE_SECS_PER_KM = COMFORTABLE_SECS_PER_MI / 1.60934;
const PACE_TOLERANCE_SECS = 1;

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

function expectWithinTolerance(
  actual: number,
  expected: number,
  tolerance = PACE_TOLERANCE_SECS
): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
}

describe("training zones pace multipliers", () => {
  it("easy pace is 10% slower than comfortable pace", () => {
    const easy = paceFromComfortableSecs(COMFORTABLE_SECS_PER_KM, 1.1, "mi");
    expectWithinTolerance(paceToSecs(easy), 660);
  });

  it("tempo pace is 8% faster than comfortable pace", () => {
    const tempo = paceFromComfortableSecs(COMFORTABLE_SECS_PER_KM, 0.92, "mi");
    expectWithinTolerance(paceToSecs(tempo), 552);
  });

  it("interval pace is 15% faster than comfortable pace", () => {
    const interval = paceFromComfortableSecs(
      COMFORTABLE_SECS_PER_KM,
      0.85,
      "mi"
    );
    expectWithinTolerance(paceToSecs(interval), 510);
  });

  it("long run pace is 45 seconds per mile slower than easy pace", () => {
    const result = computeTrainingZones(
      [
        makeRun(5, "5:00", { id: 1 }),
        makeRun(5, "5:00", { id: 2 }),
        makeRun(5, "5:00", { id: 3 }),
      ],
      "mi"
    );
    expect(result.confident).toBe(true);
    const easyPaceSecs = paceToSecs(result.easyPace);
    const longRunSecs = paceToSecs(result.longRunPace);
    expectWithinTolerance(longRunSecs, easyPaceSecs + 45);
  });

  it("recovery pace is 75 seconds per mile slower than easy pace", () => {
    const result = computeTrainingZones(
      [
        makeRun(5, "5:00", { id: 1 }),
        makeRun(5, "5:00", { id: 2 }),
        makeRun(5, "5:00", { id: 3 }),
      ],
      "mi"
    );
    expect(result.confident).toBe(true);
    const easyPaceSecs = paceToSecs(result.easyPace);
    const recoverySecs = paceToSecs(result.recoveryPace);
    expectWithinTolerance(recoverySecs, easyPaceSecs + 75);
  });
});

describe("computeTrainingZones qualifying runs", () => {
  it("returns confident false with fewer than 3 qualifying runs", () => {
    const runs = [
      makeRun(5, "5:00", { id: 1 }),
      makeRun(5, "5:00", { id: 2 }),
    ];
    const result = computeTrainingZones(runs, "mi");
    expect(result.confident).toBe(false);
  });

  it("returns confident true with exactly 3 qualifying runs", () => {
    const runs = [
      makeRun(5, "5:00", { id: 1 }),
      makeRun(5, "5:00", { id: 2 }),
      makeRun(5, "5:00", { id: 3 }),
    ];
    const result = computeTrainingZones(runs, "mi");
    expect(result.confident).toBe(true);
    expect(result.qualifyingRunCount).toBe(3);
  });

  it("returns confident false for a single run input", () => {
    const result = computeTrainingZones([makeRun(5, "5:00", { id: 1 })], "mi");
    expect(result.confident).toBe(false);
  });

  it("returns confident false for empty array input", () => {
    const result = computeTrainingZones([], "mi");
    expect(result.confident).toBe(false);
    expect(result.easyPace).toBe("--");
    expect(result.qualifyingRunCount).toBe(0);
  });

  it("returns confident false when all runs are filtered out", () => {
    const runs = [
      makeRun(2, "5:00", { id: 1 }),
      makeRun(2, "5:00", { id: 2 }),
      makeRun(1, "5:00", { id: 3 }),
    ];
    const result = computeTrainingZones(runs, "km");
    expect(result.confident).toBe(false);
    expect(result.qualifyingRunCount).toBe(0);
    expect(result.easyPace).toBe("--");
  });
});

describe("computeTrainingZones distance boundary", () => {
  const qualifyingPace = "5:00";

  it("excludes runs just below the minimum distance", () => {
    const runs = [
      makeRun(2.99, qualifyingPace, { id: 1 }),
      makeRun(2.99, qualifyingPace, { id: 2 }),
      makeRun(2.99, qualifyingPace, { id: 3 }),
    ];
    const result = computeTrainingZones(runs, "km");
    expect(result.confident).toBe(false);
    expect(result.qualifyingRunCount).toBe(0);
  });

  it("includes runs exactly at the minimum distance", () => {
    const runs = [
      makeRun(3, qualifyingPace, { id: 1 }),
      makeRun(3, qualifyingPace, { id: 2 }),
      makeRun(3, qualifyingPace, { id: 3 }),
    ];
    const result = computeTrainingZones(runs, "km");
    expect(result.confident).toBe(true);
    expect(result.qualifyingRunCount).toBe(3);
  });

  it("includes runs just above the minimum distance", () => {
    const runs = [
      makeRun(3.01, qualifyingPace, { id: 1 }),
      makeRun(3.01, qualifyingPace, { id: 2 }),
      makeRun(3.01, qualifyingPace, { id: 3 }),
    ];
    const result = computeTrainingZones(runs, "km");
    expect(result.confident).toBe(true);
    expect(result.qualifyingRunCount).toBe(3);
  });
});

describe("computeTrainingZones pace boundary", () => {
  const qualifyingDistanceKm = 5;

  it("excludes runs just faster than the minimum qualifying pace", () => {
    const runs = [
      makeRun(qualifyingDistanceKm, "3:59", { id: 1 }),
      makeRun(qualifyingDistanceKm, "3:59", { id: 2 }),
      makeRun(qualifyingDistanceKm, "3:59", { id: 3 }),
    ];
    const result = computeTrainingZones(runs, "km");
    expect(result.confident).toBe(false);
    expect(result.qualifyingRunCount).toBe(0);
  });

  it("includes runs exactly at the minimum qualifying pace", () => {
    const runs = [
      makeRun(qualifyingDistanceKm, "4:00", { id: 1 }),
      makeRun(qualifyingDistanceKm, "4:00", { id: 2 }),
      makeRun(qualifyingDistanceKm, "4:00", { id: 3 }),
    ];
    const result = computeTrainingZones(runs, "km");
    expect(result.confident).toBe(true);
    expect(result.qualifyingRunCount).toBe(3);
  });

  it("includes runs just slower than the minimum qualifying pace", () => {
    const runs = [
      makeRun(qualifyingDistanceKm, "4:01", { id: 1 }),
      makeRun(qualifyingDistanceKm, "4:01", { id: 2 }),
      makeRun(qualifyingDistanceKm, "4:01", { id: 3 }),
    ];
    const result = computeTrainingZones(runs, "km");
    expect(result.confident).toBe(true);
    expect(result.qualifyingRunCount).toBe(3);
  });
});

describe("computeTrainingZones pace derivation", () => {
  it("derives easy pace as 10% slower than the median comfortable pace", () => {
    const result = computeTrainingZones(
      [
        makeRun(5, "5:00", { id: 1 }),
        makeRun(5, "5:00", { id: 2 }),
        makeRun(5, "5:00", { id: 3 }),
      ],
      "km"
    );
    expect(result.confident).toBe(true);
    const comfortableSecs = paceToSecs(result.comfortablePacePerKm);
    const easySecs = paceToSecs(result.easyPace);
    expectWithinTolerance(easySecs, comfortableSecs * 1.1);
  });
});

describe("tanakaMaxHr", () => {
  it("computes max heart rate as 208 minus 0.7 times age", () => {
    expect(tanakaMaxHr(20)).toBe(194);
    expect(tanakaMaxHr(50)).toBe(173);
    expect(tanakaMaxHr(65)).toBe(162.5);
  });
});

describe("formatPace", () => {
  it("returns placeholder for non-positive seconds", () => {
    expect(formatPace(0)).toBe("--");
    expect(formatPace(-10)).toBe("--");
  });

  it("converts whole-minute durations to M:SS format", () => {
    expect(formatPace(600)).toBe("10:00");
  });

  it("converts durations with remainder seconds to M:SS format", () => {
    expect(formatPace(390)).toBe("6:30");
  });
});

describe("race result path", () => {
  it("uses race input when distance and time are provided", () => {
    const result = computeTrainingZones([], "mi", {
      recentRaceDistance: "5k",
      recentRaceTime: "25:00",
    });
    expect(result.noRaceResult).toBe(false);
    expect(result.confident).toBe(true);
  });

  it("falls back to safe defaults when race input is missing", () => {
    const result = computeTrainingZones([], "mi");
    expect(result.confident).toBe(false);
    expect(result.noRaceResult).toBe(true);
    expect(result.easyPace).toBe("--");
  });
});
