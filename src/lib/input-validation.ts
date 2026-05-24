export type ValidateInputType = "injury" | "goal" | "note";

export interface ValidateInputResult {
  valid: boolean;
  message?: string;
}

const PROFANITY = [
  "damn",
  "hell",
  "shit",
  "fuck",
  "bitch",
  "asshole",
  "bastard",
];

const DRUG_KEYWORDS = [
  "oxycodone",
  "hydrocodone",
  "fentanyl",
  "morphine",
  "tramadol",
  "codeine",
  "adderall",
  "xanax",
  "valium",
  "prednisone",
  "ibuprofen prescription",
  "prescribe",
  "prescription",
  "mg tablet",
  "dosage",
];

const EXPLICIT_KEYWORDS = [
  "porn",
  "sexual",
  "nude",
  "xxx",
];

const BODY_SYMPTOM_WORDS = [
  "ache",
  "ankle",
  "arch",
  "arm",
  "back",
  "blister",
  "bone",
  "burn",
  "calf",
  "cramp",
  "discomfort",
  "elbow",
  "fatigue",
  "fascia",
  "feet",
  "foot",
  "fracture",
  "groin",
  "hamstring",
  "heel",
  "hip",
  "inflammation",
  "injury",
  "knee",
  "leg",
  "lumbar",
  "muscle",
  "neck",
  "pain",
  "patella",
  "quad",
  "rib",
  "shin",
  "shoulder",
  "sore",
  "spasm",
  "sprain",
  "stiff",
  "stiffness",
  "strain",
  "swelling",
  "symptom",
  "tendon",
  "thigh",
  "tight",
  "tightness",
  "tibia",
  "toe",
  "toenail",
  "weakness",
  "wrist",
];

const EMAIL_PATTERN = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const PHONE_PATTERN = /(\+?\d[\d\s().-]{7,}\d)/;
const URL_PATTERN = /(https?:\/\/|www\.)/i;

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, "").trim();
}

function containsBlockedKeyword(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((word) => lower.includes(word));
}

function containsBodyOrSymptomWord(text: string): boolean {
  const lower = text.toLowerCase();
  return BODY_SYMPTOM_WORDS.some((word) => {
    const pattern = new RegExp(`\\b${word}\\b`, "i");
    return pattern.test(lower);
  });
}

export function validateUserInput(
  rawText: string,
  type: ValidateInputType
): ValidateInputResult {
  const text = stripHtml(rawText);

  if (!text) {
    return { valid: false, message: "Input cannot be empty." };
  }

  if (text.length > 150) {
    return { valid: false, message: "Input must be 150 characters or less." };
  }

  if (EMAIL_PATTERN.test(text)) {
    return { valid: false, message: "Please do not include email addresses." };
  }

  if (PHONE_PATTERN.test(text)) {
    return { valid: false, message: "Please do not include phone numbers." };
  }

  if (URL_PATTERN.test(text)) {
    return { valid: false, message: "Please do not include URLs." };
  }

  if (containsBlockedKeyword(text, PROFANITY)) {
    return { valid: false, message: "Please use appropriate language." };
  }

  if (containsBlockedKeyword(text, EXPLICIT_KEYWORDS)) {
    return { valid: false, message: "This input is not allowed." };
  }

  if (containsBlockedKeyword(text, DRUG_KEYWORDS)) {
    return {
      valid: false,
      message: "Medical prescriptions cannot be entered here.",
    };
  }

  if (type === "injury" && !containsBodyOrSymptomWord(text)) {
    return {
      valid: false,
      message: "Please describe a physical symptom or injury location.",
    };
  }

  return { valid: true };
}
