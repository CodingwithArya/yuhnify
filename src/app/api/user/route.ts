import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getUserSettings,
  updateUserSettings,
} from "@/lib/user-settings-store";
import { normalizeProfilePatch } from "@/lib/user-profile";
import type { UserProfile } from "@/types/profile";

function profileResponse(
  userId: string,
  profile: UserProfile,
  email: string
) {
  return {
    userId,
    email,
    firstName: profile.firstName,
    units: profile.units,
    age: profile.age,
    biologicalSex: profile.biologicalSex,
    currentWeeklyMileage: profile.currentWeeklyMileage,
    runningExperience: profile.runningExperience,
    previousRace: profile.previousRace,
    primaryGoal: profile.primaryGoal,
  };
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.accessToken || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized", code: "NOT_AUTHENTICATED" },
        { status: 401 }
      );
    }

    const profile = getUserSettings(session.user.id);
    const defaultFirst =
      session.user.name?.split(" ")[0] ?? session.user.name ?? "";

    return NextResponse.json(
      profileResponse(session.user.id, {
        ...profile,
        firstName: profile.firstName || defaultFirst,
      }, session.user.email ?? "")
    );
  } catch (error) {
    console.error("User GET failed:", error);
    return NextResponse.json(
      { error: "Could not load user settings", code: "USER_ERROR" },
      { status: 500 }
    );
  }
}

type PatchBody = Partial<UserProfile> & { displayName?: string };

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.accessToken || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized", code: "NOT_AUTHENTICATED" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as PatchBody;

    if (body.units && body.units !== "mi" && body.units !== "km") {
      return NextResponse.json(
        { error: "Units must be mi or km", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    const normalized = normalizeProfilePatch(body);

    if (
      normalized.firstName !== undefined &&
      normalized.firstName.length > 100
    ) {
      return NextResponse.json(
        { error: "First name too long", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    if (normalized.primaryGoal && normalized.primaryGoal.length > 200) {
      return NextResponse.json(
        { error: "Primary goal must be 200 characters or less", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    const updated = updateUserSettings(session.user.id, normalized);

    return NextResponse.json(
      profileResponse(session.user.id, updated, session.user.email ?? "")
    );
  } catch (error) {
    console.error("User PATCH failed:", error);
    return NextResponse.json(
      { error: "Could not update user settings", code: "USER_ERROR" },
      { status: 500 }
    );
  }
}
