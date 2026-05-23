import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

interface FeedbackBody {
  message?: string;
  email?: string;
  url?: string;
  userAgent?: string;
  screenSize?: string;
  isMobile?: boolean;
  timestamp?: string;
  recentErrors?: string[];
  componentStack?: string;
}

interface RateLimitEntry {
  count: number;
  date: string;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const STRAVA_SCOPES = "read,activity:read_all";

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

  if (entry.count >= 5) {
    return false;
  }

  entry.count += 1;
  return true;
}

function parseDevice(userAgent: string): string {
  let browser = "Unknown browser";
  if (userAgent.includes("Edg/")) browser = "Edge";
  else if (userAgent.includes("Chrome/")) browser = "Chrome";
  else if (userAgent.includes("Firefox/")) browser = "Firefox";
  else if (userAgent.includes("Safari/")) browser = "Safari";

  let os = "Unknown OS";
  if (userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("Mac OS")) os = "macOS";
  else if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Linux")) os = "Linux";

  return `${browser} | ${os}`;
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized", code: "NOT_AUTHENTICATED" },
        { status: 401 }
      );
    }

    if (!checkRateLimit(session.user.id)) {
      return NextResponse.json(
        { error: "Too many submissions today", code: "RATE_LIMITED" },
        { status: 429 }
      );
    }

    const body = (await request.json()) as FeedbackBody;
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required", code: "INVALID_MESSAGE" },
        { status: 400 }
      );
    }

    if (message.length > 500) {
      return NextResponse.json(
        { error: "Message must be 500 characters or less", code: "INVALID_MESSAGE" },
        { status: 400 }
      );
    }

    const sessionInfo = {
      userId: session.user.id,
      subscriptionStatus: "free" as const,
      stravaConnected: Boolean(session.accessToken),
      scopes: session.accessToken ? STRAVA_SCOPES : "none",
    };

    const email = body.email?.trim() || session.user.email || "anonymous";
    const userAgent = body.userAgent ?? "unknown";
    const device = parseDevice(userAgent);
    const screenSize = body.screenSize ?? "unknown";
    const deviceType = body.isMobile ? "mobile" : "desktop";
    const recentErrors =
      body.recentErrors && body.recentErrors.length > 0
        ? body.recentErrors.join("\n")
        : "none";
    const componentStack = body.componentStack ?? "n/a";

    console.log(`BUG REPORT
----------
Message: ${message}
User: ${sessionInfo.userId} | ${email} | ${sessionInfo.subscriptionStatus}
Page: ${body.url ?? "unknown"}
Time: ${body.timestamp ?? new Date().toISOString()}
Device: ${device} | ${screenSize} | ${deviceType}
Strava: ${sessionInfo.stravaConnected ? "connected" : "not connected"} | Scopes: ${sessionInfo.scopes}
Component: ${componentStack}
Recent errors: ${recentErrors}`);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Feedback submission failed:", error);
    return NextResponse.json(
      { error: "Could not submit feedback", code: "FEEDBACK_ERROR" },
      { status: 500 }
    );
  }
}
