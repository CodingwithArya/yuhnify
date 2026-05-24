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

export interface CoachApiResponse {
  plan: TrainingPlan;
  generatedAt: string;
  generationsRemaining: number | "unlimited";
}

export interface CheckInPayload {
  day: string;
  runType: string;
  distanceKm: number;
  feeling: string;
  completed: string;
  notes?: string;
  planWeek: string;
}

export interface CheckInResponse {
  saved: boolean;
  adjusted: boolean;
  plan?: TrainingPlan;
  changedDays?: string[];
}
