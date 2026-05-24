import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  validateUserInput,
  type ValidateInputType,
} from "@/lib/input-validation";

interface ValidateInputBody {
  text?: string;
  type?: ValidateInputType;
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT = 20;
const WINDOW_MS = 60 * 60 * 1000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    rateLimitMap.set(userId, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count += 1;
  return true;
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { valid: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!checkRateLimit(session.user.id)) {
      return NextResponse.json(
        { valid: false, message: "Too many validation requests. Try again later." },
        { status: 429 }
      );
    }

    const body = (await request.json()) as ValidateInputBody;
    const type = body.type;

    if (type !== "injury" && type !== "goal" && type !== "note") {
      return NextResponse.json(
        { valid: false, message: "Invalid input type." },
        { status: 400 }
      );
    }

    const result = validateUserInput(body.text ?? "", type);

    if (!result.valid) {
      console.warn("Rejected validate-input:", {
        userId: session.user.id,
        type,
        text: (body.text ?? "").slice(0, 80),
        message: result.message,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("validate-input failed:", error);
    return NextResponse.json(
      { valid: false, message: "Validation failed." },
      { status: 500 }
    );
  }
}
