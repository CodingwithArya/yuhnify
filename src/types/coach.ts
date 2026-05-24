import type {
  PlannedRun,
  PlanApproach,
  ResearchSource,
  TrainingPlan,
} from "@/types";

import type { UserProfile } from "@/types/profile";

export type { PlanApproach, ResearchSource, PlannedRun, TrainingPlan };

export interface CoachProfilePayload {
  age?: number;
  biologicalSex?: UserProfile["biologicalSex"];
  runningExperience?: UserProfile["runningExperience"];
  currentWeeklyMileage?: UserProfile["currentWeeklyMileage"];
  previousRace?: UserProfile["previousRace"];
  primaryGoal?: string;
  units?: UserProfile["units"];
  perinatalStatus?: UserProfile["perinatalStatus"];
  healthConditions?: UserProfile["healthConditions"];
  currentInjuries?: string[];
}

export interface CoachFormValues {
  raceDate: string;
  goalTime: string;
  daysPerWeek: "2" | "3" | "4";
  additionalNotes: string;
  recentRaceDistance?: string;
  recentRaceTime?: string;
  recentRaceDate?: string;
  optimizingFor?: string;
  customApproach?: string;
}

export type OptimizingGoal = "finish_strong" | "hit_goal" | "run_faster" | "ai_decides";

export interface CoachGenerateRequest extends CoachFormValues {
  feedback?: string;
  previousPlan?: TrainingPlan;
}

import type { InjuryAlert } from "@/lib/injury-intelligence";

export interface CoachApiResponse {
  plan: TrainingPlan;
  generatedAt: string;
  generationsRemaining: number | "unlimited";
  injuryAlerts?: InjuryAlert[];
}

export interface CheckInPayload {
  day: string;
  runType: string;
  distanceKm: number;
  feeling: string;
  completed: string;
  notes?: string;
  painLevel?: "none" | "mild" | "moderate" | "severe";
  painLocations?: string[];
  planWeek: string;
}

export interface CheckInResponse {
  saved: boolean;
  adjusted: boolean;
  plan?: TrainingPlan;
  changedDays?: string[];
}
