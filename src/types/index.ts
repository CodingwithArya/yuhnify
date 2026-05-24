export interface StravaActivity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  type: string;
  start_date: string;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
}

export interface ProcessedRun {
  id: number;
  name: string;
  date: string;
  distanceKm: number;
  distanceMiles: number;
  durationMinutes: number;
  pacePerKm: string;
  pacePerMile: string;
  elevationGainM: number;
  avgHeartrate?: number;
  maxHeartrate?: number;
}

export interface ResearchSource {
  label: string;
  url: string;
  summary: string;
}

export interface PlanApproach {
  name: string;
  reasoning: string;
  primarySource: ResearchSource;
  injurySource: ResearchSource;
  additionalSources: ResearchSource[];
}

export interface PlannedRun {
  day: string;
  type: "easy" | "tempo" | "intervals" | "long" | "recovery" | "rest";
  distanceKm: number;
  description: string;
  targetPace?: string | null;
  heartRateZone?: string | null;
  notes?: string;
}

export interface TrainingPlan {
  keyFocus: string;
  weekSummary: string;
  fitnessAssessment: string;
  runs: PlannedRun[];
  generalAdvice: string;
  realisticGoalTime: string;
  warningFlags?: string[];
  planApproach?: PlanApproach;
  trainingPhase?: "base" | "build" | "peak" | "taper";
  weeksToRace?: number;
}

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    error?: string;
  }
}