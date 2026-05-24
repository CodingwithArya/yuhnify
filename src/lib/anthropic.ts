import Anthropic from "@anthropic-ai/sdk";
import type { PlanApproach, ResearchSource, TrainingPlan } from "@/types";
import type { CheckIn } from "@/lib/checkin-store";
import type { Units } from "@/lib/units";
import type { UserProfile } from "@/types/profile";
import { buildAthleteProfilePrompt } from "@/lib/user-profile";
import {
  buildProfileConditionalPrompt,
  CROSS_TRAINING_RULES,
  MENTAL_HEALTH_RULES,
  PACE_RULES,
  PROGRESSIVE_OVERLOAD_RULES,
  VOLUME_INTENSITY_RULES,
  WARNING_FLAGS_RULES,
  WEEKLY_STRUCTURE_RULES,
} from "@/lib/coaching-prompt-sections";
import {
  computeTrainingPhase,
  type TrainingPhase,
} from "@/lib/training-zones";

export const RESEARCH_SOURCES = {
  "80_20": {
    label: "Seiler & Kjerland, Scand J Med Sci Sports, 2006",
    url: "https://pubmed.ncbi.nlm.nih.gov/16430681/",
    summary:
      "Elite endurance athletes naturally train at 80% low intensity. Recreational runners copying this improve 5% more than 50/50 groups.",
  },
  polarized: {
    label: "Stoggl & Sperlich, Front Physiol, 2014",
    url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3912323/",
    summary:
      "Polarized training produced the greatest VO2max gain at 11.7% compared to threshold, HIIT, and high-volume approaches.",
  },
  taper: {
    label: "Mujika & Padilla, Med Sci Sports Exerc, 2003",
    url: "https://pubmed.ncbi.nlm.nih.gov/12618582/",
    summary:
      "2-3 week taper reducing volume by 60% while maintaining intensity produces optimal race day performance.",
  },
  hrv_guided: {
    label: "Kiviniemi et al., Eur J Appl Physiol, 2007",
    url: "https://pubmed.ncbi.nlm.nih.gov/17849143/",
    summary:
      "HRV-guided training produced significantly larger improvements in running speed than fixed training plans.",
  },
  injury_spike: {
    label: "Frandsen et al., Br J Sports Med, 2025",
    url: "https://bjsm.bmj.com/content/59/17/1203",
    summary:
      "Study of 5,200 runners: a 30% spike in a single run length increases injury risk by 64%.",
  },
  strength_injury: {
    label: "Lauersen et al., Br J Sports Med, 2014",
    url: "https://pubmed.ncbi.nlm.nih.gov/23914909/",
    summary:
      "Strength training reduces sports injury risk by up to 66% and overuse injuries by 50% across 7,738 participants.",
  },
  progressive_overload: {
    label: "Gabbett, Br J Sports Med, 2016",
    url: "https://pubmed.ncbi.nlm.nih.gov/27539279/",
    summary:
      "Training load spikes above 10% per week significantly increase injury risk across multiple sports.",
  },
  vdot: {
    label: "Daniels & Gilbert, Med Sci Sports, 1979",
    url: "https://pubmed.ncbi.nlm.nih.gov/469800/",
    summary:
      "The VDOT system derives personalized training paces from race performance, accounting for VO2max and running economy.",
  },
  lactate_threshold: {
    label: "Esteve-Lanao et al., Med Sci Sports Exerc, 2007",
    url: "https://pubmed.ncbi.nlm.nih.gov/17468580/",
    summary:
      "Intensity distribution directly relates to race performance. Higher easy volume predicts better race outcomes.",
  },
  sleep_performance: {
    label: "Daaloul et al., PMC, 2021",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8076583/",
    summary:
      "Partial sleep deprivation decreases 3km time trial performance by 4% and impairs metabolic recovery.",
  },
  hrv_monitoring: {
    label: "Plews et al., Sports Med, 2013",
    url: "https://pubmed.ncbi.nlm.nih.gov/23852425/",
    summary:
      "HRV responds predictably to training loads in endurance athletes and is a reliable day-to-day monitoring tool.",
  },
  long_run: {
    label: "Videbaek et al., Sports Med, PMC, 2020",
    url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7496388/",
    summary:
      "Training volume and longest run are the two strongest predictors of half marathon performance.",
  },
  masters_recovery: {
    label: "Tanaka & Seals, J Physiol, 2008",
    url: "https://pubmed.ncbi.nlm.nih.gov/17303676/",
    summary:
      "Endurance performance declines 6-9% per decade after 35 but masters athletes maintain high fitness with appropriate adjustments.",
  },
  female_performance: {
    label: "Engseth et al., J Appl Physiol, 2025",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11971592/",
    summary:
      "Menstrual cycle phase affects running economy during high-intensity sessions. Individual variation is significant.",
  },
  postpartum: {
    label: "Deering et al., BJSM, 2024, Postpartum return to running consensus",
    url: "https://bjsm.bmj.com/content/58/6/326",
    summary:
      "2024 international consensus: strength training essential before return to running postpartum. Minimum 12 weeks before impact exercise.",
  },
  karvonen_hr: {
    label: "Karvonen et al., Ann Med Exp Biol Fenn, 1957",
    url: "https://pubmed.ncbi.nlm.nih.gov/13470504/",
    summary:
      "The Karvonen heart rate reserve method for calculating personalized training intensity zones.",
  },
  tanaka_maxhr: {
    label: "Tanaka et al., J Am Coll Cardiol, 2001",
    url: "https://pubmed.ncbi.nlm.nih.gov/11153730/",
    summary:
      "Age-predicted max HR: 208 minus 0.7 times age. More accurate than the older 220-age formula.",
  },
  injury_prevention_review: {
    label: "Linton et al., Translational Sports Medicine, 2025",
    url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11986186/",
    summary:
      "Scoping review of 106 running injury prevention studies. Supervision and support are critical for better outcomes.",
  },
  runner_types: {
    label: "Janssen et al., PMC, 2020",
    url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7177805/",
    summary:
      "Four distinct recreational runner types: casual, social, competitive, and devoted. Each needs different coaching approaches.",
  },
  mental_health_running: {
    label: "Oswald et al., Int J Environ Res Public Health, 2020",
    url: "https://pubmed.ncbi.nlm.nih.gov/33080751/",
    summary:
      "Running has significant positive effects on depression and anxiety in a scoping review of the evidence.",
  },
  cadence_knee: {
    label: "Schubert et al., Int J Sports Phys Ther, 2014",
    url: "https://pubmed.ncbi.nlm.nih.gov/25110607/",
    summary:
      "Increasing running cadence by 5-10% reduces knee joint loading and patellofemoral stress.",
  },
  nordic_hamstring: {
    label: "Petersen et al., Am J Sports Med, 2011",
    url: "https://pubmed.ncbi.nlm.nih.gov/21825112/",
    summary:
      "Nordic hamstring protocol reduces hamstring injury recurrence by 51%.",
  },
} as const satisfies Record<string, ResearchSource>;

type ResearchSourceKey = keyof typeof RESEARCH_SOURCES;

function toSource(key: ResearchSourceKey): ResearchSource {
  const entry = RESEARCH_SOURCES[key];
  return {
    label: entry.label,
    url: entry.url,
    summary: entry.summary,
  };
}

function resolveSourceKeys(approachName: string): {
  primary: ResearchSourceKey;
  additional: ResearchSourceKey[];
} {
  const name = approachName.toLowerCase();

  if (name.includes("80/20") || name.includes("80-20") || name.includes("base")) {
    return { primary: "80_20", additional: ["long_run"] };
  }

  if (name.includes("polarized")) {
    return { primary: "polarized", additional: ["80_20"] };
  }

  if (
    name.includes("threshold") ||
    name.includes("pfitz") ||
    name.includes("tempo")
  ) {
    return { primary: "lactate_threshold", additional: ["vdot"] };
  }

  return { primary: "80_20", additional: ["progressive_overload"] };
}

export function attachResearchSources(plan: TrainingPlan): TrainingPlan {
  if (!plan.planApproach?.name) {
    return plan;
  }

  const { primary, additional } = resolveSourceKeys(plan.planApproach.name);

  const planApproach: PlanApproach = {
    name: plan.planApproach.name,
    reasoning: plan.planApproach.reasoning,
    primarySource: toSource(primary),
    injurySource: toSource("injury_spike"),
    additionalSources: additional.map((key) => toSource(key)),
  };

  return { ...plan, planApproach };
}

export const SYSTEM_PROMPT_BASE = `You are an expert running coach specializing in half marathon and marathon training. You analyze real run data to create personalized, data-driven training plans. Your advice is specific and calibrated to the athlete's actual fitness level. Be encouraging but honest. Never use em dashes in your responses. Respond only with valid JSON. Keep descriptions to 15 words or fewer. Keep generalAdvice to 3 sentences maximum. Keep each warningFlag to 1 sentence. Do not include source URLs or citations. The app attaches peer-reviewed sources server-side.

Apply training periodization based on the athlete's phase:

BASE PHASE (10+ weeks out):
- 90% easy volume, 10% quality maximum
- No tempo or intervals yet, easy runs only
- Focus: building weekly volume and long run
- Long run maximum 30% of weekly volume
- Volume increases no more than 10% week over week

BUILD PHASE (5-10 weeks out):
- 80% easy, 20% quality
- One quality session per week (tempo or threshold)
- Long run builds toward 10-12 miles for half marathon
- Begin adding goal pace segments to long runs

PEAK PHASE (3-5 weeks out):
- 75% easy, 25% quality
- One tempo and one interval session per week
- Long run reaches 12-14 miles maximum for half marathon
- Include race-pace miles in long runs

TAPER (1-2 weeks out):
- Reduce total volume by 40-60% vs peak week
- Keep one short quality session to maintain sharpness
- No new workout types the athlete has not done before
- Prioritize sleep and recovery above everything

State the current phase in keyFocus. Explain briefly why the week looks the way it does.
Never prescribe intervals or tempo in base phase.
Never increase volume in taper phase.`;

export function buildSystemPrompt(
  units: Units,
  trainingPhase?: TrainingPhase,
  athleteProfile?: UserProfile
): string {
  const unitLabel = units === "mi" ? "miles" : "kilometers";
  const paceFormat = units === "mi" ? "X:XX/mi" : "X:XX/km";
  const phaseNote = trainingPhase
    ? `\nThe athlete is currently in ${trainingPhase.toUpperCase()} phase. Apply phase rules strictly.`
    : "";

  let profileSections = "";
  try {
    profileSections = buildProfileConditionalPrompt(athleteProfile);
  } catch {
    profileSections = "";
  }

  return `${SYSTEM_PROMPT_BASE}

${PACE_RULES}

${VOLUME_INTENSITY_RULES}

${WEEKLY_STRUCTURE_RULES}

${CROSS_TRAINING_RULES}

${PROGRESSIVE_OVERLOAD_RULES}

${MENTAL_HEALTH_RULES}

${WARNING_FLAGS_RULES}${profileSections}${phaseNote}

Never mix units. If the athlete uses miles, every pace and distance in your response must be in miles. Never show /km to a miles user or /mi to a km user.

Display all paces and distances in ${unitLabel} in your response. The athlete uses ${unitLabel}. All targetPace values in the plan JSON must be in ${paceFormat} format. The distanceKm field must always store distance as kilometers numerically, but describe distances in text using ${unitLabel}.`;
}

export const SYSTEM_PROMPT = buildSystemPrompt("km");

export function buildCoachUserPrompt(params: {
  runSummary: string;
  zonesSummary?: string;
  raceDate?: string;
  goalTime?: string;
  daysPerWeek?: number;
  additionalNotes?: string;
  weeksUntilRace: number;
  trainingPhase: TrainingPhase;
  optimizingFor?: string;
  customApproach?: string;
  feedback?: string;
  previousPlan?: TrainingPlan;
  units: Units;
  athleteProfile?: UserProfile;
  recentRacePrompt?: string;
  injuryPromptSection?: string;
}): string {
  const {
    runSummary,
    zonesSummary,
    raceDate,
    goalTime,
    daysPerWeek,
    additionalNotes,
    weeksUntilRace,
    trainingPhase,
    optimizingFor,
    customApproach,
    feedback,
    previousPlan,
    units,
    athleteProfile,
    recentRacePrompt,
    injuryPromptSection,
  } = params;

  const unitLabel = units === "mi" ? "miles" : "kilometers";
  const paceFormat = units === "mi" ? "X:XX/mi" : "X:XX/km";

  const regenerationBlock = feedback
    ? `
The athlete reviewed the plan and said: ${feedback}.
Regenerate addressing their specific concern. Keep what worked.
Previous plan JSON:
${JSON.stringify(previousPlan ?? {})}
`
    : "";

  const zonesBlock = zonesSummary
    ? `
TRAINING PACE ZONES:
${zonesSummary}
`
    : "";

  const profileBlock = athleteProfile
    ? `
${buildAthleteProfilePrompt(athleteProfile)}
`
    : "";

  const recentRaceBlock = recentRacePrompt
    ? `
${recentRacePrompt}
`
    : "";

  const injuryBlock = injuryPromptSection
    ? `
${injuryPromptSection}
`
    : "";

  return `Create a personalized weekly training plan based on this athlete's recent run data.

RECENT RUN DATA:
${runSummary}
${zonesBlock}${profileBlock}${recentRaceBlock}${injuryBlock}
ATHLETE GOALS:
- Race date: ${raceDate ?? "Not specified"}
- Goal finish time: ${goalTime ?? "Not specified"}
- Training days per week: ${daysPerWeek ?? 3}
- Weeks until race: ${weeksUntilRace}
- Training phase: ${trainingPhase}
- Additional notes: ${additionalNotes ?? "None"}
- Preferred units: ${unitLabel}

The athlete is optimizing for: ${optimizingFor ?? "Balanced training"}.
Custom approach requested: ${customApproach?.trim() || "none"}.
Choose the most evidence-based methodology for their goal and current fitness data. Name the approach clearly (e.g. 80/20 Polarized, Threshold Focus, Polarized Training).

Display all paces and distances in ${unitLabel} in your response. The athlete uses ${unitLabel}. All targetPace values in the plan JSON must be in ${paceFormat} format. The distanceKm field must always store kilometers numerically.
${regenerationBlock}
Respond with JSON matching this exact schema:
{
  "keyFocus": "string - main focus for this week, max 15 words",
  "weekSummary": "string - max 2 sentences",
  "fitnessAssessment": "string - max 2 sentences, use ${unitLabel} only",
  "realisticGoalTime": "string - projected finish time",
  "trainingPhase": "base|build|peak|taper",
  "weeksToRace": number,
  "planApproach": {
    "name": "string - e.g. 80/20 Polarized",
    "reasoning": "string - 1 sentence, max 100 chars, no em dashes"
  },
  "runs": [
    {
      "day": "Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday",
      "type": "easy|tempo|intervals|long|recovery|rest",
      "distanceKm": number,
      "description": "string - max 15 words",
      "targetPace": "string or null - e.g. ${paceFormat}",
      "heartRateZone": "string or null - e.g. Zone 2, Threshold"
    }
  ],
  "generalAdvice": "string - max 3 sentences",
  "warningFlags": ["string array, max 1 sentence each, empty if none"]
}

Include exactly 7 days (Monday through Sunday). Match the requested training days per week. Be specific with paces based on their recent run data. Do not include sourceLabel, sourceUrl, or any URLs in your response.`;
}

export function buildCheckInPrompt(checkins: CheckIn[]): string {
  return `Here are the athlete's recent check-ins:
${JSON.stringify(checkins.slice(-6), null, 2)}

Should the remaining plan be adjusted based on this feedback?
If yes, return JSON:
{
  "adjusted": true,
  "changedDays": ["Monday", "..."],
  "runs": [ only the remaining days of the week with updated workouts using the same run schema ]
}
If no, return JSON: { "adjusted": false }

Keep the response concise and specific to the data. Never use em dashes.`;
}

interface ClaudePlanApproach {
  name: string;
  reasoning: string;
  sourceLabel?: string;
  sourceUrl?: string;
}

export function parseTrainingPlanResponse(
  raw: string,
  weeksToRace?: number
): TrainingPlan {
  let cleaned = raw.trim();

  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const parsed = JSON.parse(cleaned) as TrainingPlan & {
    planApproach?: ClaudePlanApproach;
  };

  if (
    !parsed.keyFocus ||
    !parsed.weekSummary ||
    !parsed.fitnessAssessment ||
    !parsed.realisticGoalTime ||
    !parsed.generalAdvice ||
    !Array.isArray(parsed.runs)
  ) {
    throw new Error("Invalid training plan structure");
  }

  const phase =
    parsed.trainingPhase ??
    (weeksToRace !== undefined ? computeTrainingPhase(weeksToRace) : undefined);

  const basePlan: TrainingPlan = {
    ...parsed,
    warningFlags: parsed.warningFlags ?? [],
    trainingPhase: phase,
    weeksToRace: parsed.weeksToRace ?? weeksToRace,
    runs: parsed.runs.map((run) => ({
      ...run,
      targetPace: run.targetPace ?? null,
      heartRateZone: run.heartRateZone ?? null,
      description: run.description,
    })),
    planApproach: parsed.planApproach
      ? {
          name: parsed.planApproach.name,
          reasoning: parsed.planApproach.reasoning,
          primarySource: toSource("80_20"),
          injurySource: toSource("injury_spike"),
          additionalSources: [],
        }
      : undefined,
  };

  return attachResearchSources(basePlan);
}

export function parseCheckInResponse(raw: string): {
  adjusted: boolean;
  changedDays?: string[];
  runs?: TrainingPlan["runs"];
} {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  return JSON.parse(cleaned) as {
    adjusted: boolean;
    changedDays?: string[];
    runs?: TrainingPlan["runs"];
  };
}

async function callClaude(
  userPrompt: string,
  units: Units,
  trainingPhase?: TrainingPhase,
  athleteProfile?: UserProfile
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Anthropic API key not configured");
  }

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 4096,
    system: buildSystemPrompt(units, trainingPhase, athleteProfile),
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }
  return textBlock.text;
}

export async function generateTrainingPlan(
  userPrompt: string,
  units: Units = "km",
  weeksToRace?: number,
  trainingPhase?: TrainingPhase,
  athleteProfile?: UserProfile
): Promise<TrainingPlan> {
  const phase =
    trainingPhase ??
    (weeksToRace !== undefined ? computeTrainingPhase(weeksToRace) : undefined);
  const text = await callClaude(userPrompt, units, phase, athleteProfile);
  return parseTrainingPlanResponse(text, weeksToRace);
}

export async function evaluateCheckInAdjustments(
  checkins: CheckIn[],
  units: Units = "km"
) {
  const text = await callClaude(buildCheckInPrompt(checkins), units);
  return parseCheckInResponse(text);
}
