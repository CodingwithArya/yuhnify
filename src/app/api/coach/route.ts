import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  fetchStravaActivities,
  processActivities,
  buildRunSummaryForAI,
} from "@/lib/strava";
import {
  buildCoachUserPrompt,
  generateTrainingPlan,
} from "@/lib/anthropic";
import { computeWeeksUntilRace, buildRecentRacePrompt } from "@/lib/coach-utils";
import { resolveCoachProfile } from "@/lib/user-profile";
import {
  computeTrainingPhase,
  computeTrainingZones,
  formatTrainingZonesSummary,
} from "@/lib/training-zones";
import type { Units } from "@/lib/units";
import type { CoachProfilePayload } from "@/types/coach";
import {
  detectInjuries,
  buildInjuryPromptSection,
  profileInjuryNotes,
  checkInToInjuryNotes,
} from "@/lib/injury-intelligence";
import { getCheckIns } from "@/lib/checkin-store";
import type { ProcessedRun, TrainingPlan } from "@/types";

interface CoachRequestBody {
  raceDate?: string;
  goalTime?: string;
  daysPerWeek?: number;
  additionalNotes?: string;
  optimizingFor?: string;
  customApproach?: string;
  feedback?: string;
  previousPlan?: TrainingPlan;
  units?: Units;
  recentRaceDistance?: string;
  recentRaceTime?: string;
  recentRaceDate?: string;
  profile?: CoachProfilePayload;
  checkInNotes?: string[];
}

interface RateLimitEntry {
  count: number;
  date: string;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function checkRateLimit(userId: string): boolean {
  const today = getTodayDateString();
  const entry = rateLimitMap.get(userId);

  if (!entry || entry.date !== today) {
    rateLimitMap.set(userId, { count: 1, date: today });
    return true;
  }

  if (entry.count >= 10) {
    return false;
  }

  entry.count += 1;
  return true;
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.accessToken || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized", code: "NOT_AUTHENTICATED" },
        { status: 401 }
      );
    }

    if (!checkRateLimit(session.user.id)) {
      return NextResponse.json(
        { error: "Daily generation limit reached", code: "RATE_LIMITED" },
        { status: 429 }
      );
    }

    const body = (await request.json()) as CoachRequestBody;
    const daysPerWeek = body.daysPerWeek ?? 3;
    const requestUnits: Units =
      body.units === "mi" || body.units === "km" ? body.units : "mi";
    const profile = resolveCoachProfile(body.profile, requestUnits);
    const units: Units = profile.units;

    console.log("Coach profile from request body:", {
      userId: session.user.id,
      age: profile.age,
      biologicalSex: profile.biologicalSex,
      runningExperience: profile.runningExperience,
      currentWeeklyMileage: profile.currentWeeklyMileage,
      previousRace: profile.previousRace,
      primaryGoal: profile.primaryGoal,
      perinatalStatus: profile.perinatalStatus,
      healthConditions: profile.healthConditions,
      units: profile.units,
    });

    if (daysPerWeek < 2 || daysPerWeek > 4) {
      return NextResponse.json(
        { error: "Days per week must be between 2 and 4", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    if (body.feedback && body.feedback.length > 200) {
      return NextResponse.json(
        { error: "Feedback must be 200 characters or less", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    let runSummary = "No recent runs found.";
    let zonesSummary: string | undefined;
    let recentRuns: ProcessedRun[] = [];
    try {
      const activities = await fetchStravaActivities(session.accessToken, 20, 0);
      recentRuns = processActivities(activities);
      runSummary = buildRunSummaryForAI(recentRuns, units);
      const zones = computeTrainingZones(recentRuns, units, {
        recentRaceDistance:
          body.recentRaceDistance && body.recentRaceDistance !== "other"
            ? body.recentRaceDistance
            : undefined,
        recentRaceTime: body.recentRaceTime,
        age: profile.age,
      });
      zonesSummary = formatTrainingZonesSummary(zones, units);
    } catch (error) {
      console.error("Strava fetch failed during coach generation:", error);
    }

    const weeksUntilRace = body.raceDate
      ? computeWeeksUntilRace(body.raceDate)
      : 0;
    const trainingPhase = computeTrainingPhase(weeksUntilRace);
    const recentRacePrompt = buildRecentRacePrompt({
      recentRaceDate: body.recentRaceDate,
      recentRaceDistance: body.recentRaceDistance,
      recentRaceTime: body.recentRaceTime,
    });

    const injuryNotes: string[] = [
      ...profileInjuryNotes(profile),
      ...(body.additionalNotes ? [body.additionalNotes] : []),
      ...recentRuns.map((run) => run.name).filter(Boolean),
      ...(body.checkInNotes ?? []),
    ];

    for (const checkIn of getCheckIns(session.user.id)) {
      injuryNotes.push(
        ...checkInToInjuryNotes(
          checkIn.notes,
          checkIn.painLevel,
          checkIn.painLocations
        )
      );
    }

    let injuryAlerts: ReturnType<typeof detectInjuries> = [];
    let injuryPromptSection = "";
    try {
      injuryAlerts = detectInjuries(injuryNotes, profile);
      if (injuryAlerts.length > 0) {
        injuryPromptSection = buildInjuryPromptSection(injuryAlerts);
      }
    } catch (error) {
      console.warn("Injury intelligence failed:", error);
    }

    const userPrompt = buildCoachUserPrompt({
      runSummary,
      zonesSummary,
      raceDate: body.raceDate,
      goalTime: body.goalTime,
      daysPerWeek,
      additionalNotes: body.additionalNotes,
      weeksUntilRace,
      trainingPhase,
      optimizingFor: body.optimizingFor,
      customApproach: body.customApproach,
      feedback: body.feedback,
      previousPlan: body.previousPlan,
      units,
      athleteProfile: profile,
      recentRacePrompt,
      injuryPromptSection: injuryPromptSection || undefined,
    });

    const plan = await generateTrainingPlan(
      userPrompt,
      units,
      weeksUntilRace,
      trainingPhase,
      profile
    );

    return NextResponse.json({
      plan,
      generatedAt: new Date().toISOString(),
      generationsRemaining: "unlimited" as const,
      injuryAlerts,
    });
  } catch (error) {
    console.error("Coach plan generation failed:", error);
    return NextResponse.json(
      { error: "Could not generate plan", code: "COACH_ERROR" },
      { status: 500 }
    );
  }
}
