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

export interface PlannedRun {
  day: string;
  type: "easy" | "tempo" | "intervals" | "long" | "recovery" | "rest";
  distanceKm: number;
  description: string;
  targetPace?: string;
}

export interface TrainingPlan {
  keyFocus: string;
  weekSummary: string;
  fitnessAssessment: string;
  runs: PlannedRun[];
  generalAdvice: string;
  realisticGoalTime: string;
}

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    error?: string;
  }
}