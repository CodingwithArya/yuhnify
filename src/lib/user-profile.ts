import type { Units } from "@/lib/units";
import type {
  BiologicalSex,
  PreviousRace,
  RunningExperience,
  UserProfile,
  WeeklyMileage,
} from "@/types/profile";

export function sanitizePrimaryGoal(
  input: string | undefined
): string | undefined {
  if (!input) return undefined;
  const cleaned = input.trim().replace(/<[^>]*>/g, "");
  if (!cleaned) return undefined;
  return cleaned.slice(0, 200);
}

export function sanitizeFirstName(input: string | undefined): string {
  if (!input) return "";
  return input.trim().replace(/<[^>]*>/g, "").slice(0, 100);
}

export function parseAge(input: unknown): number | undefined {
  if (input === undefined || input === null || input === "") return undefined;
  const num = typeof input === "number" ? input : Number(input);
  if (!Number.isFinite(num) || num < 10 || num > 100) return undefined;
  return Math.round(num);
}

const VALID_SEX = new Set<BiologicalSex>(["male", "female", "prefer_not_to_say"]);
const VALID_MILEAGE = new Set<WeeklyMileage>([
  "less_than_10",
  "10_20",
  "20_30",
  "30_plus",
]);
const VALID_EXPERIENCE = new Set<RunningExperience>([
  "just_starting",
  "1_2_years",
  "3_5_years",
  "5_plus_years",
]);
const VALID_PREVIOUS_RACE = new Set<PreviousRace>(["yes", "no"]);

export function normalizeProfilePatch(
  patch: Partial<UserProfile> & { displayName?: string }
): Partial<UserProfile> {
  const normalized: Partial<UserProfile> = {};

  if (patch.units === "mi" || patch.units === "km") {
    normalized.units = patch.units;
  }
  if (patch.firstName !== undefined || patch.displayName !== undefined) {
    normalized.firstName = sanitizeFirstName(
      patch.firstName ?? patch.displayName
    );
  }
  if (patch.age !== undefined) {
    normalized.age = parseAge(patch.age);
  }
  if (patch.biologicalSex && VALID_SEX.has(patch.biologicalSex)) {
    normalized.biologicalSex = patch.biologicalSex;
  }
  if (
    patch.currentWeeklyMileage &&
    VALID_MILEAGE.has(patch.currentWeeklyMileage)
  ) {
    normalized.currentWeeklyMileage = patch.currentWeeklyMileage;
  }
  if (
    patch.runningExperience &&
    VALID_EXPERIENCE.has(patch.runningExperience)
  ) {
    normalized.runningExperience = patch.runningExperience;
  }
  if (patch.previousRace && VALID_PREVIOUS_RACE.has(patch.previousRace)) {
    normalized.previousRace = patch.previousRace;
  }
  if (patch.primaryGoal !== undefined) {
    normalized.primaryGoal = sanitizePrimaryGoal(patch.primaryGoal);
  }

  return normalized;
}

export function resolveCoachProfile(
  bodyProfile: Partial<UserProfile> | undefined,
  fallbackUnits: Units = "mi"
): UserProfile {
  const normalized = normalizeProfilePatch(bodyProfile ?? {});
  return {
    firstName: normalized.firstName ?? "",
    units: normalized.units ?? fallbackUnits,
    age: normalized.age,
    biologicalSex: normalized.biologicalSex,
    currentWeeklyMileage: normalized.currentWeeklyMileage,
    runningExperience: normalized.runningExperience,
    previousRace: normalized.previousRace,
    primaryGoal: normalized.primaryGoal,
  };
}

export function getWeeklyMileageOptions(units: Units) {
  if (units === "km") {
    return [
      { value: "less_than_10" as const, label: "Less than 16 km" },
      { value: "10_20" as const, label: "16-32 km" },
      { value: "20_30" as const, label: "32-48 km" },
      { value: "30_plus" as const, label: "48+ km" },
    ];
  }
  return [
    { value: "less_than_10" as const, label: "Less than 10 mi" },
    { value: "10_20" as const, label: "10-20 mi" },
    { value: "20_30" as const, label: "20-30 mi" },
    { value: "30_plus" as const, label: "30+ mi" },
  ];
}

export function formatWeeklyMileage(
  value: WeeklyMileage | undefined,
  units: Units
): string {
  if (!value) return "unknown";
  const option = getWeeklyMileageOptions(units).find((o) => o.value === value);
  return option?.label ?? value;
}

export function formatRunningExperience(
  value: RunningExperience | undefined
): string {
  switch (value) {
    case "just_starting":
      return "Just starting out";
    case "1_2_years":
      return "1-2 years";
    case "3_5_years":
      return "3-5 years";
    case "5_plus_years":
      return "5+ years";
    default:
      return "unknown";
  }
}

export function formatBiologicalSex(value: BiologicalSex | undefined): string {
  switch (value) {
    case "male":
      return "Male";
    case "female":
      return "Female";
    case "prefer_not_to_say":
      return "Prefer not to say";
    default:
      return "unknown";
  }
}

export function formatPreviousRace(value: PreviousRace | undefined): string {
  if (value === "yes") return "Yes";
  if (value === "no") return "No";
  return "unknown";
}

export function buildAthleteProfilePrompt(profile: UserProfile): string {
  const goalText = profile.primaryGoal ?? "not specified";
  const goalBlock =
    goalText !== "not specified"
      ? `
Athlete's stated goal in their own words: '${goalText}'
Use this to inform the tone and focus of the plan.
If the goal is unclear or unusual, interpret it charitably and ask a clarifying question in the generalAdvice field rather than guessing.
Never invent details the athlete did not state.`
      : "";

  return `Athlete profile:
Age: ${profile.age ?? "unknown"}
Sex: ${formatBiologicalSex(profile.biologicalSex)}
Experience: ${formatRunningExperience(profile.runningExperience)}
Current weekly volume: ${formatWeeklyMileage(profile.currentWeeklyMileage, profile.units)}
Previous half or full marathon: ${formatPreviousRace(profile.previousRace)}
Primary goal: ${goalText}${goalBlock}`;
}
