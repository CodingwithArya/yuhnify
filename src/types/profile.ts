import type { Units } from "@/lib/units";

export type BiologicalSex = "male" | "female" | "prefer_not_to_say";
export type WeeklyMileage = "less_than_10" | "10_20" | "20_30" | "30_plus";
export type RunningExperience =
  | "just_starting"
  | "1_2_years"
  | "3_5_years"
  | "5_plus_years";
export type PreviousRace = "yes" | "no";
export type PerinatalStatus =
  | "pregnant"
  | "postpartum"
  | "postpartum_under_6"
  | "postpartum_6_12"
  | "no";
export type HealthCondition =
  | "diabetes"
  | "type_1_diabetes"
  | "type_2_diabetes"
  | "high_blood_pressure"
  | "asthma"
  | "heart_condition"
  | "osteoporosis"
  | "autoimmune"
  | "anemia"
  | "thyroid_condition"
  | "pcos"
  | "previous_stress_fracture"
  | "chronic_pain"
  | "mental_health"
  | "none"
  | "prefer_not_to_say";
export type PainLevel = "none" | "mild" | "moderate" | "severe";
export type PainLocation =
  | "knee"
  | "shin"
  | "calf_achilles"
  | "heel_arch"
  | "hip"
  | "hamstring"
  | "ankle"
  | "lower_back"
  | "other";

export interface UserProfile {
  firstName: string;
  units: Units;
  age?: number;
  biologicalSex?: BiologicalSex;
  currentWeeklyMileage?: WeeklyMileage;
  runningExperience?: RunningExperience;
  previousRace?: PreviousRace;
  primaryGoal?: string;
  perinatalStatus?: PerinatalStatus;
  healthConditions?: HealthCondition[];
  currentInjuries?: string[];
}

export const EMPTY_PROFILE: UserProfile = {
  firstName: "",
  units: "mi",
};
