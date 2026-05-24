export type Units = "mi" | "km";

export const UNITS_STORAGE_KEY = "yuhnify_units";

const KM_TO_MI = 0.621371;
const MI_TO_KM = 1 / KM_TO_MI;

export function getDefaultUnits(): Units {
  return "mi";
}

export function kmToMiles(km: number): number {
  return Math.round(km * KM_TO_MI * 10) / 10;
}

export function milesToKm(miles: number): number {
  return Math.round(miles * MI_TO_KM * 10) / 10;
}

export function parsePaceToSeconds(pace: string): number | null {
  const match = pace.match(/^(\d+):(\d{2})$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function formatPaceFromSeconds(secs: number): string {
  if (secs <= 0) return "--";
  const mins = Math.floor(secs / 60);
  const seconds = Math.round(secs % 60);
  return `${mins}:${seconds.toString().padStart(2, "0")}`;
}

export function convertPaceKmToMi(pacePerKm: string): string {
  const secs = parsePaceToSeconds(pacePerKm.replace(/\/km.*$/i, "").trim());
  if (secs === null) return pacePerKm;
  return `${formatPaceFromSeconds(secs * 1.60934)}/mi`;
}

export function convertPaceMiToKm(pacePerMi: string): string {
  const secs = parsePaceToSeconds(pacePerMi.replace(/\/mi.*$/i, "").trim());
  if (secs === null) return pacePerMi;
  return `${formatPaceFromSeconds(secs / 1.60934)}/km`;
}

export function formatDistance(km: number, units: Units): string {
  if (units === "mi") {
    return `${kmToMiles(km)} mi`;
  }
  return `${Math.round(km * 10) / 10} km`;
}

export function formatPaceForUnits(
  pacePerKm: string | null | undefined,
  units: Units
): string {
  return ensurePaceInUnits(pacePerKm, units);
}

export function ensurePaceInUnits(
  pace: string | null | undefined,
  units: Units
): string {
  if (!pace || pace === "--") return "--";

  const hasMi = /\/mi\b/i.test(pace);
  const hasKm = /\/km\b/i.test(pace);
  const base = pace.replace(/\/(km|mi).*$/i, "").trim();

  if (units === "mi") {
    if (hasMi) return pace;
    const converted = convertPaceKmToMi(`${base}/km`);
    return converted.includes("/mi") ? converted : `${converted}/mi`;
  }

  if (hasKm) return pace;
  if (hasMi) return convertPaceMiToKm(pace);
  return `${base}/km`;
}

export function normalizeFitnessAssessment(text: string, units: Units): string {
  if (units === "mi") {
    return text
      .replace(/\/km\b/gi, "/mi")
      .replace(/(\d+\.?\d*)\s*km\b/gi, (_, num: string) => {
        const miles = kmToMiles(Number(num));
        return `${miles} mi`;
      });
  }

  return text
    .replace(/\/mi\b/gi, "/km")
    .replace(/(\d+\.?\d*)\s*mi\b/gi, (_, num: string) => {
      const km = milesToKm(Number(num));
      return `${km} km`;
    });
}

export function planPacesUseMiles(
  runs: { targetPace?: string | null }[]
): boolean {
  return runs.some((run) => run.targetPace && /\/mi\b/i.test(run.targetPace));
}

export function safeDisplayDistanceKm(
  distanceKm: number,
  units: Units,
  planUsesMilePaces: boolean
): number {
  if (
    units === "mi" &&
    planUsesMilePaces &&
    distanceKm > 0 &&
    distanceKm <= 16
  ) {
    return milesToKm(distanceKm);
  }
  return distanceKm;
}

export function readUnitsFromStorage(): Units {
  if (typeof window === "undefined") return getDefaultUnits();
  const stored = localStorage.getItem(UNITS_STORAGE_KEY);
  return stored === "km" ? "km" : "mi";
}

export function writeUnitsToStorage(units: Units): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(UNITS_STORAGE_KEY, units);
}

export function hasUnitsPreference(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(UNITS_STORAGE_KEY) !== null;
}
