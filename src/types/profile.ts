import type { Units } from "@/lib/units";

export type BiologicalSex = "male" | "female" | "prefer_not_to_say";
export type WeeklyMileage = "less_than_10" | "10_20" | "20_30" | "30_plus";
export type RunningExperience =
  | "just_starting"
  | "1_2_years"
  | "3_5_years"
  | "5_plus_years";
export type PreviousRace = "yes" | "no";

export interface UserProfile {
  firstName: string;
  units: Units;
  age?: number;
  biologicalSex?: BiologicalSex;
  currentWeeklyMileage?: WeeklyMileage;
  runningExperience?: RunningExperience;
  previousRace?: PreviousRace;
  primaryGoal?: string;
}

export const EMPTY_PROFILE: UserProfile = {
  firstName: "",
  units: "mi",
};
