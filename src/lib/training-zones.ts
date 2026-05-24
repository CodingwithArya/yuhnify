import type { ProcessedRun } from "@/types";
import {
  formatPaceFromSeconds,
  parsePaceToSeconds,
  type Units,
} from "@/lib/units";

const MIN_DISTANCE_KM = 3;
const MIN_PACE_SECS_PER_KM = 4 * 60;
const MIN_QUALIFYING_RUNS = 3;

const RACE_DISTANCES_KM: Record<string, number> = {
  "5k": 5,
  "10k": 10,
  "15k": 15,
  half: 21.0975,
  marathon: 42.195,
};

export type TrainingPhase = "base" | "build" | "peak" | "taper";

export interface TrainingZonesInput {
  recentRaceDistance?: string;
  recentRaceTime?: string;
  age?: number;
}

export interface HeartRateZones {
  maxHr: number;
  restingHr: number;
  zone2Min: number;
  zone2Max: number;
  thresholdMin: number;
  thresholdMax: number;
}

export interface TrainingZonesResult {
  confident: boolean;
  noRaceResult: boolean;
  comfortablePacePerKm: string;
  comfortablePacePerMi: string;
  easyPace: string;
  longRunPace: string;
  recoveryPace: string;
  tempoPace: string;
  intervalPace: string;
  qualifyingRunCount: number;
  vdot: number | null;
  hrZones: HeartRateZones | null;
  note: string;
}

function emptyResult(note: string): TrainingZonesResult {
  return {
    confident: false,
    noRaceResult: true,
    comfortablePacePerKm: "--",
    comfortablePacePerMi: "--",
    easyPace: "--",
    longRunPace: "--",
    recoveryPace: "--",
    tempoPace: "--",
    intervalPace: "--",
    qualifyingRunCount: 0,
    vdot: null,
    hrZones: null,
    note,
  };
}

export function formatPace(secs: number): string {
  if (secs <= 0 || !Number.isFinite(secs)) return "--";
  return formatPaceFromSeconds(secs);
}

export function tanakaMaxHr(age: number): number {
  return 208 - 0.7 * age;
}

export function paceStringToSecsPerKm(pace: string): number | null {
  const base = pace.replace(/\/(km|mi).*$/i, "").trim();
  const secs = parsePaceToSeconds(base);
  if (secs === null) return null;
  if (/\/mi/i.test(pace)) {
    return secs / 1.60934;
  }
  return secs;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function estimateVdot(distanceMeters: number, timeSeconds: number): number {
  if (timeSeconds <= 0 || distanceMeters <= 0) return 0;
  const velocityMps = distanceMeters / timeSeconds;
  const velocityMpm = velocityMps * 60;
  const vo2 =
    -4.6 +
    0.182258 * velocityMpm +
    0.000104 * velocityMpm * velocityMpm;
  const minutes = timeSeconds / 60;
  const percentMax =
    0.8 +
    0.1894393 * Math.exp(-0.012778 * minutes) +
    0.2989558 * Math.exp(-0.1932605 * minutes);
  if (percentMax <= 0) return 0;
  return Math.round((vo2 / percentMax) * 10) / 10;
}

export function parseRaceTimeToSeconds(time: string): number | null {
  const trimmed = time.trim();
  const parts = trimmed.split(":").map(Number);
  if (parts.some((p) => Number.isNaN(p))) return null;
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return null;
}

function formatPaceWithUnit(secsPerKm: number, units: Units): string {
  const suffix = units === "mi" ? "/mi" : "/km";
  if (units === "mi") {
    return `${formatPaceFromSeconds(secsPerKm * 1.60934)}${suffix}`;
  }
  return `${formatPaceFromSeconds(secsPerKm)}${suffix}`;
}

export function paceFromComfortableSecs(
  comfortableSecsPerKm: number,
  multiplier: number,
  units: Units
): string {
  return formatPaceWithUnit(comfortableSecsPerKm * multiplier, units);
}

function easySecsPerKmFromComfortable(comfortableSecsPerKm: number): number {
  return comfortableSecsPerKm * 1.1;
}

function longRunPaceFromEasySecs(easySecsPerKm: number, units: Units): string {
  if (units === "mi") {
    const longSecsPerKm = (easySecsPerKm * 1.60934 + 45) / 1.60934;
    return formatPaceWithUnit(longSecsPerKm, units);
  }
  return formatPaceWithUnit(easySecsPerKm + 28, units);
}

function recoveryPaceFromEasySecs(easySecsPerKm: number, units: Units): string {
  if (units === "mi") {
    const recoverySecsPerKm = (easySecsPerKm * 1.60934 + 75) / 1.60934;
    return formatPaceWithUnit(recoverySecsPerKm, units);
  }
  const recoveryAddKm = 75 / 1.60934;
  return formatPaceWithUnit(easySecsPerKm + recoveryAddKm, units);
}

function pacesFromEasySecsPerKm(easySecsPerKm: number, units: Units) {
  return {
    easyPace: formatPaceWithUnit(easySecsPerKm, units),
    longRunPace: longRunPaceFromEasySecs(easySecsPerKm, units),
    recoveryPace: recoveryPaceFromEasySecs(easySecsPerKm, units),
  };
}

function filterQualifyingRuns(runs: ProcessedRun[]): ProcessedRun[] {
  return runs.filter((run) => {
    if (run.distanceKm < MIN_DISTANCE_KM) return false;
    const paceSecs = paceStringToSecsPerKm(run.pacePerKm);
    if (paceSecs === null) return false;
    return paceSecs >= MIN_PACE_SECS_PER_KM;
  });
}

function estimateRestingHr(runs: ProcessedRun[]): number {
  const hrs = runs
    .map((r) => r.avgHeartrate)
    .filter((hr): hr is number => typeof hr === "number" && hr > 0);
  if (hrs.length === 0) return 60;
  return Math.round(Math.min(...hrs));
}

export function computeKarvonenZones(
  age: number,
  runs: ProcessedRun[]
): HeartRateZones | null {
  try {
    if (!age || age < 10 || age > 100) return null;
    const maxHr = Math.round(tanakaMaxHr(age));
    const restingHr = estimateRestingHr(runs);
    const hrr = maxHr - restingHr;
    if (hrr <= 0) return null;

    const zone2Min = Math.round(restingHr + hrr * 0.6);
    const zone2Max = Math.round(restingHr + hrr * 0.7);
    const thresholdMin = Math.round(restingHr + hrr * 0.8);
    const thresholdMax = Math.round(restingHr + hrr * 0.9);

    return {
      maxHr,
      restingHr,
      zone2Min,
      zone2Max,
      thresholdMin,
      thresholdMax,
    };
  } catch (error) {
    console.warn("Karvonen zone computation failed:", error);
    return null;
  }
}

function buildZonesFromComfortable(
  comfortableSecsPerKm: number,
  units: Units,
  opts: {
    noRaceResult: boolean;
    vdot: number | null;
    qualifyingRunCount: number;
    hrZones: HeartRateZones | null;
  }
): TrainingZonesResult {
  const comfortablePacePerKm = `${formatPaceFromSeconds(comfortableSecsPerKm)}/km`;
  const comfortablePacePerMi = `${formatPaceFromSeconds(comfortableSecsPerKm * 1.60934)}/mi`;
  const easySecsPerKm = easySecsPerKmFromComfortable(comfortableSecsPerKm);
  const paces = pacesFromEasySecsPerKm(easySecsPerKm, units);

  return {
    confident: true,
    noRaceResult: opts.noRaceResult,
    comfortablePacePerKm,
    comfortablePacePerMi,
    easyPace: paces.easyPace,
    longRunPace: paces.longRunPace,
    recoveryPace: paces.recoveryPace,
    tempoPace: paceFromComfortableSecs(comfortableSecsPerKm, 0.92, units),
    intervalPace: paceFromComfortableSecs(comfortableSecsPerKm, 0.85, units),
    qualifyingRunCount: opts.qualifyingRunCount,
    vdot: opts.vdot,
    hrZones: opts.hrZones,
    note: opts.noRaceResult
      ? "Paces derived from comfortable training pace, not a race result."
      : "Paces derived from recent race VDOT.",
  };
}

function velocityFromVdotPercent(vdot: number, percent: number): number {
  const durationMinutes = 60;
  const percentMax =
    0.8 +
    0.1894393 * Math.exp(-0.012778 * durationMinutes) +
    0.2989558 * Math.exp(-0.1932605 * durationMinutes);
  const vo2 = vdot * percentMax * percent;
  const a = 0.000104;
  const b = 0.182258;
  const c = -4.6 - vo2;
  const discriminant = b * b - 4 * a * c;
  if (discriminant <= 0) return 0;
  return (-b + Math.sqrt(discriminant)) / (2 * a);
}

function paceFromVdotPercent(
  vdot: number,
  percent: number,
  units: Units
): string {
  const velocityMpm = velocityFromVdotPercent(vdot, percent);
  if (velocityMpm <= 0) return "--";
  const secsPerKm = 1000 / (velocityMpm / 60);
  return formatPaceWithUnit(secsPerKm, units);
}

function buildZonesFromVdot(
  vdot: number,
  units: Units,
  hrZones: HeartRateZones | null
): TrainingZonesResult {
  const easySecsPerKm =
    1000 / (velocityFromVdotPercent(vdot, 0.7) / 60) || 0;
  const paces = easySecsPerKm > 0 ? pacesFromEasySecsPerKm(easySecsPerKm, units) : {
    easyPace: "--",
    longRunPace: "--",
    recoveryPace: "--",
  };
  const comfortablePacePerKm =
    easySecsPerKm > 0
      ? `${formatPaceFromSeconds(easySecsPerKm / 1.1)}/km`
      : "--";
  const comfortablePacePerMi =
    easySecsPerKm > 0
      ? `${formatPaceFromSeconds((easySecsPerKm / 1.1) * 1.60934)}/mi`
      : "--";

  return {
    confident: true,
    noRaceResult: false,
    comfortablePacePerKm,
    comfortablePacePerMi,
    easyPace: paces.easyPace,
    longRunPace: paces.longRunPace,
    recoveryPace: paces.recoveryPace,
    tempoPace: paceFromVdotPercent(vdot, 0.88, units),
    intervalPace: paceFromVdotPercent(vdot, 0.95, units),
    qualifyingRunCount: 0,
    vdot,
    hrZones,
    note: "Paces derived from recent race VDOT.",
  };
}

function zonesFromRace(
  distanceKey: string,
  timeSeconds: number,
  units: Units,
  hrZones: HeartRateZones | null
): TrainingZonesResult | null {
  const distanceKm = RACE_DISTANCES_KM[distanceKey];
  if (!distanceKm || timeSeconds <= 0) return null;

  const vdot = estimateVdot(distanceKm * 1000, timeSeconds);
  if (vdot <= 0) return null;

  return buildZonesFromVdot(vdot, units, hrZones);
}

export function computeTrainingPhase(weeksToRace: number): TrainingPhase {
  if (weeksToRace <= 2) return "taper";
  if (weeksToRace >= 3 && weeksToRace <= 5) return "peak";
  if (weeksToRace >= 6 && weeksToRace <= 10) return "build";
  return "base";
}

export function computeTrainingZones(
  runs: ProcessedRun[],
  units: Units = "km",
  input: TrainingZonesInput = {}
): TrainingZonesResult {
  try {
    const hrZones =
      input.age && runs.some((r) => r.avgHeartrate)
        ? computeKarvonenZones(input.age, runs)
        : null;

    if (input.recentRaceDistance && input.recentRaceTime) {
      const timeSeconds = parseRaceTimeToSeconds(input.recentRaceTime);
      const raceZones = zonesFromRace(
        input.recentRaceDistance,
        timeSeconds ?? 0,
        units,
        hrZones
      );
      if (raceZones) return raceZones;
    }

    if (runs.length === 0) {
      return emptyResult("Insufficient run data for pace estimates.");
    }

    const qualifying = filterQualifyingRuns(runs);

    if (qualifying.length < MIN_QUALIFYING_RUNS) {
      return emptyResult("Insufficient run data for pace estimates.");
    }

    const paceSecsList = qualifying
      .map((run) => paceStringToSecsPerKm(run.pacePerKm))
      .filter((secs): secs is number => secs !== null);

    if (paceSecsList.length < MIN_QUALIFYING_RUNS) {
      return emptyResult("Insufficient run data for pace estimates.");
    }

    const comfortableSecsPerKm = median(paceSecsList);
    const medianDistanceKm = median(qualifying.map((run) => run.distanceKm));
    const timeSeconds = comfortableSecsPerKm * medianDistanceKm;
    const vdot = estimateVdot(medianDistanceKm * 1000, timeSeconds);

    return buildZonesFromComfortable(comfortableSecsPerKm, units, {
      noRaceResult: true,
      vdot: vdot > 0 ? vdot : null,
      qualifyingRunCount: qualifying.length,
      hrZones,
    });
  } catch (error) {
    console.warn("Training zone computation failed, using fallback:", error);
    try {
      const qualifying = filterQualifyingRuns(runs);
      if (qualifying.length === 0) {
        return emptyResult("Zone computation failed. Insufficient data.");
      }
      const paceSecsList = qualifying
        .map((run) => paceStringToSecsPerKm(run.pacePerKm))
        .filter((secs): secs is number => secs !== null);
      const avg = paceSecsList.reduce((a, b) => a + b, 0) / paceSecsList.length;
      return buildZonesFromComfortable(avg, units, {
        noRaceResult: true,
        vdot: null,
        qualifyingRunCount: qualifying.length,
        hrZones: null,
      });
    } catch {
      return emptyResult("Zone computation failed.");
    }
  }
}

export function formatTrainingZonesSummary(
  result: TrainingZonesResult,
  units: Units
): string {
  if (!result.confident) {
    return result.note;
  }

  const comfortable =
    units === "mi" ? result.comfortablePacePerMi : result.comfortablePacePerKm;
  const unitLabel = units === "mi" ? "miles" : "kilometers";
  const unitWord = units === "mi" ? "mile" : "km";
  const offset = units === "mi" ? "45 sec/mi" : "28 sec/km";
  const lines: string[] = [
    `Comfortable training pace: ${comfortable}`,
    `Easy / Zone 2: ${result.easyPace}`,
    `Long run pace: ${result.longRunPace} per ${unitWord} (${offset} slower than easy). Time on feet, not pace.`,
    `Recovery run pace: ${result.recoveryPace}`,
    `Tempo / Threshold: ${result.tempoPace}`,
    `Interval: ${result.intervalPace}`,
  ];

  if (result.vdot) {
    lines.push(`Estimated VDOT: ${result.vdot}`);
  }

  if (result.noRaceResult) {
    lines.push(
      "Paces estimated from comfortable training pace, not a race result. These are conservative estimates. Tempo should feel like 7-8 out of 10 effort, hard but sustainable for 20-40 minutes. If athlete says it feels too hard, adjust slower."
    );
  } else {
    lines.push("Paces derived from recent race result VDOT.");
  }

  if (result.hrZones) {
    lines.push(
      `HR zones (Karvonen): Zone 2 ${result.hrZones.zone2Min}-${result.hrZones.zone2Max} bpm, Threshold ${result.hrZones.thresholdMin}-${result.hrZones.thresholdMax} bpm. Prescribe by HR where possible.`
    );
  }

  lines.push(`Use ${unitLabel} for all plan paces and distance descriptions.`);
  return lines.join("\n");
}
