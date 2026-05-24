import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  addCheckIn,
  getCheckInCount,
  getCheckIns,
  type CheckIn,
} from "@/lib/checkin-store";
import { evaluateCheckInAdjustments } from "@/lib/anthropic";
import { getUserSettings } from "@/lib/user-settings-store";
import type { Units } from "@/lib/units";
import type { PainLevel, PainLocation } from "@/types/profile";
import type { TrainingPlan } from "@/types";

interface CheckInBody {
  day?: string;
  runType?: string;
  distanceKm?: number;
  feeling?: string;
  completed?: string;
  notes?: string;
  painLevel?: PainLevel;
  painLocations?: PainLocation[];
  planWeek?: string;
  currentPlan?: TrainingPlan;
  units?: Units;
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

  if (entry.count >= 20) {
    return false;
  }

  entry.count += 1;
  return true;
}

const VALID_FEELINGS = ["Very hard", "Hard", "Ok", "Easy", "Very easy"];
const VALID_COMPLETED = ["Yes", "Partial", "No"];
const VALID_PAIN_LEVELS = new Set<PainLevel>([
  "none",
  "mild",
  "moderate",
  "severe",
]);
const VALID_PAIN_LOCATIONS = new Set<PainLocation>([
  "knee",
  "shin",
  "calf_achilles",
  "heel_arch",
  "hip",
  "hamstring",
  "ankle",
  "lower_back",
  "other",
]);

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
        { error: "Daily check-in limit reached", code: "RATE_LIMITED" },
        { status: 429 }
      );
    }

    const body = (await request.json()) as CheckInBody;
    const settings = getUserSettings(session.user.id);
    const units: Units =
      body.units === "mi" || body.units === "km" ? body.units : settings.units;

    if (!body.day || !body.feeling || !body.completed) {
      return NextResponse.json(
        { error: "Day, feeling, and completed are required", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    if (!VALID_FEELINGS.includes(body.feeling)) {
      return NextResponse.json(
        { error: "Invalid feeling value", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    if (!VALID_COMPLETED.includes(body.completed)) {
      return NextResponse.json(
        { error: "Invalid completed value", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    if (body.notes && body.notes.length > 150) {
      return NextResponse.json(
        { error: "Notes must be 150 characters or less", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    const painLevel: PainLevel = body.painLevel ?? "none";
    if (!VALID_PAIN_LEVELS.has(painLevel)) {
      return NextResponse.json(
        { error: "Invalid pain level", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    const painLocations =
      painLevel !== "none" && Array.isArray(body.painLocations)
        ? body.painLocations.filter((loc) => VALID_PAIN_LOCATIONS.has(loc))
        : undefined;

    if (painLevel !== "none" && (!painLocations || painLocations.length === 0)) {
      return NextResponse.json(
        { error: "Pain location required when pain is reported", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    const checkin: CheckIn = {
      id: crypto.randomUUID(),
      day: body.day,
      runType: body.runType ?? "unknown",
      distanceKm: body.distanceKm ?? 0,
      feeling: body.feeling,
      completed: body.completed,
      notes: body.notes,
      painLevel,
      painLocations,
      planWeek: body.planWeek ?? "unknown",
      createdAt: new Date().toISOString(),
    };

    addCheckIn(session.user.id, checkin);
    const count = getCheckInCount(session.user.id);

    if (count % 2 !== 0) {
      return NextResponse.json({ saved: true, adjusted: false });
    }

    try {
      const checkins = getCheckIns(session.user.id);
      const result = await evaluateCheckInAdjustments(checkins, units);

      if (!result.adjusted || !result.runs || !body.currentPlan) {
        return NextResponse.json({ saved: true, adjusted: false });
      }

      const updatedRuns = body.currentPlan.runs.map((run) => {
        const updated = result.runs?.find(
          (r) => r.day.toLowerCase() === run.day.toLowerCase()
        );
        return updated ? { ...run, ...updated } : run;
      });

      const plan: TrainingPlan = {
        ...body.currentPlan,
        runs: updatedRuns,
      };

      return NextResponse.json({
        saved: true,
        adjusted: true,
        plan,
        changedDays: result.changedDays ?? [],
      });
    } catch (error) {
      console.error("Check-in adjustment failed:", error);
      return NextResponse.json({ saved: true, adjusted: false });
    }
  } catch (error) {
    console.error("Check-in failed:", error);
    return NextResponse.json(
      { error: "Could not save check-in", code: "CHECKIN_ERROR" },
      { status: 500 }
    );
  }
}
