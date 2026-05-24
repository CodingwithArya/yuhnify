import Anthropic from "@anthropic-ai/sdk";
import type { PlanApproach, ResearchSource, TrainingPlan } from "@/types";
import type { CheckIn } from "@/lib/checkin-store";
import type { Units } from "@/lib/units";
import type { UserProfile } from "@/types/profile";
import { buildAthleteProfilePrompt } from "@/lib/user-profile";
import {
  computeTrainingPhase,
  type TrainingPhase,
} from "@/lib/training-zones";

export const RESEARCH_SOURCES = {
  "80/20": {
    label: "Seiler & Kjerland, Scand J Med Sci Sports, 2006",
    url: "https://pubmed.ncbi.nlm.nih.gov/16430681/",
    summary:
      "Elite athletes naturally train at 80% low intensity. Recreational runners who copy this improve 5% more than 50/50 training groups.",
  },
  polarized: {
    label: "Stoggl & Sperlich, Front Physiol, 2014",
    url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3912323/",
    summary:
      "Polarized training produced the greatest VO2max increase (11.7%) compared to threshold, HIIT, and high-volume approaches.",
  },
  polarized_recreational: {
    label: "Munoz, Seiler et al., Int J Sports Physiol Perform, 2014",
    url: "https://pubmed.ncbi.nlm.nih.gov/23752040/",
    summary:
      "Polarized training improved performance in recreational runners compared to threshold-focused plans.",
  },
  threshold: {
    label: "Esteve-Lanao et al., Med Sci Sports Exerc, 2007",
    url: "https://pubmed.ncbi.nlm.nih.gov/17468580/",
    summary:
      "Shows how endurance runners actually train and relates intensity distribution to race performance.",
  },
  lactate_threshold: {
    label: "Lactate Threshold Training Review, ResearchGate, 2024",
    url: "https://www.researchgate.net/publication/378261635",
    summary:
      "Improved lactate clearance and metabolic efficiency from threshold training leads to longer time to exhaustion and better race performance.",
  },
  machine_learning_plans: {
    label: "Reis et al., Scientific Reports, 2025",
    url: "https://www.nature.com/articles/s41598-025-25369-7",
    summary:
      "Machine learning analysis of 120 marathon runners found polarized training produced 30% greater improvements, but individual response varies significantly.",
  },
  injury_single_run: {
    label: "Frandsen et al., Br J Sports Med, 2025",
    url: "https://bjsm.bmj.com/content/59/17/1203",
    summary:
      "Study of 5,200 runners found a 30% spike in single run length increases injury risk by 64%. Weekly total matters less than individual session spikes.",
  },
  injury_volume: {
    label: "Nielsen et al., J Orthop Sports Phys Ther, 2014",
    url: "https://www.jospt.org/doi/10.2519/jospt.2014.5164",
    summary:
      "Research on training volume progression and running-related injury risk in recreational runners.",
  },
  injury_training_volume: {
    label: "Videbaek et al., Sports Med, PMC, 2020",
    url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7496388/",
    summary:
      "Training volume and longest endurance run are both related to half marathon performance and injury rates.",
  },
  injury_systematic_review: {
    label: "Damsted et al., Sports Med, PMC, 2022",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9528699/",
    summary:
      "Systematic review on training parameters and injury. The 10% weekly rule is not scientifically justified. Single session spikes are the real risk.",
  },
  hrv_guided_training: {
    label: "Kiviniemi et al., Eur J Appl Physiol, 2007",
    url: "https://pubmed.ncbi.nlm.nih.gov/17849143/",
    summary:
      "HRV-guided training produced significantly larger improvements in maximum running speed than coach-designed fixed plans.",
  },
  hrv_meta_analysis: {
    label: "Javaloyes et al., PMC, 2021",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8507742/",
    summary:
      "Meta-analysis confirms HRV-guided training is superior to predefined training for improving cardiac-vagal modulation and aerobic fitness.",
  },
  hrv_monitoring: {
    label: "Esco et al., Sensors, 2025",
    url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12787763/",
    summary:
      "Daily HRV monitoring using RMSSD is recommended for optimizing recovery and training adaptations. Weekly averages are more useful than single readings.",
  },
  hrv_elite: {
    label: "Plews et al., Sports Med, 2013",
    url: "https://pubmed.ncbi.nlm.nih.gov/23852425/",
    summary:
      "How HRV responds to training loads in elite endurance athletes and how to use it as a day-to-day monitoring tool.",
  },
  sleep_performance: {
    label: "Vitale et al., Int J Sports Med, 2019",
    url: "https://pubmed.ncbi.nlm.nih.gov/31288293/",
    summary:
      "Sleep hygiene recommendations for optimizing recovery in athletes. Sleep restriction impairs both performance and recovery.",
  },
  sleep_deprivation_running: {
    label: "Daaloul et al., PMC, 2021",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8076583/",
    summary:
      "Partial sleep deprivation decreases 3km time trial performance by 4% and impairs metabolic recovery between training sessions.",
  },
  sleep_comprehensive: {
    label: "Kunath et al., J Clin Med, 2025",
    url: "https://www.mdpi.com/2077-0383/14/21/7606",
    summary:
      "Comprehensive review on sleep and athletic performance covering physiological, molecular, and epigenetic mechanisms.",
  },
  marathon_training_volume: {
    label: "DeJong Lempke et al., Sports Med, 2025",
    url: "https://doi.org/10.1007/s40279-025-02304-4",
    summary:
      "Study of 900+ Boston Marathon runners found training volume and frequency changes are associated with race performance.",
  },
  marathon_plans_analysis: {
    label: "Knopp et al., Sports Med Open, 2024",
    url: "https://link.springer.com/article/10.1186/s40798-024-00717-5",
    summary:
      "Quantitative analysis of 92 sub-elite marathon training plans showing pyramidal intensity distribution in most real-world successful programs.",
  },
  default: {
    label: "80/20 Endurance Research Overview",
    url: "https://www.8020endurance.com/seilers-hierarchy-of-endurance-training-needs/",
    summary:
      "Overview of Seiler's hierarchy of endurance training needs - the foundational framework behind modern polarized training.",
  },
  periodization: {
    label: "Bompa & Buzzichelli, Periodization of Strength, 2015",
    url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4371881/",
    summary:
      "Periodized training produces 25% greater performance gains than non-periodized approaches in endurance athletes.",
  },
  taper_science: {
    label: "Mujika & Padilla, Med Sci Sports Exerc, 2003",
    url: "https://pubmed.ncbi.nlm.nih.gov/12618582/",
    summary:
      "2-3 week exponential taper reducing volume by 60% while maintaining intensity produces optimal race day performance.",
  },
  lydiard_periodization: {
    label: "Lydiard, foundational periodization methodology",
    url: "https://www.worldathletics.org/be-active/training/lydiard-method",
    summary:
      "Lydiard base-strength-anaerobic-coordination sequence: the foundational periodization model used by coaches worldwide.",
  },
  mcmillan_zones: {
    label: "McMillan Running, pace zone methodology",
    url: "https://www.mcmillanrunning.com/mcmillan-running-calculator/",
    summary:
      "McMillan pace zones derived from comfortable training pace when no race result is available.",
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
      "Age-predicted max HR formula 208 minus 0.7 times age, more accurate than the older 220-age formula.",
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

  if (name.includes("80/20") || name.includes("base")) {
    return { primary: "80/20", additional: [] };
  }

  if (name.includes("polarized")) {
    return { primary: "polarized", additional: ["polarized_recreational"] };
  }

  if (
    name.includes("threshold") ||
    name.includes("pfitz") ||
    name.includes("tempo")
  ) {
    return { primary: "threshold", additional: ["lactate_threshold"] };
  }

  return { primary: "default", additional: [] };
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
    injurySource: toSource("injury_single_run"),
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

export function buildSystemPrompt(units: Units, trainingPhase?: TrainingPhase): string {
  const unitLabel = units === "mi" ? "miles" : "kilometers";
  const paceFormat = units === "mi" ? "X:XX/mi" : "X:XX/km";
  const phaseNote = trainingPhase
    ? `\nThe athlete is currently in ${trainingPhase.toUpperCase()} phase. Apply phase rules strictly.`
    : "";

  return `${SYSTEM_PROMPT_BASE}${phaseNote}

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

  return `Create a personalized weekly training plan based on this athlete's recent run data.

RECENT RUN DATA:
${runSummary}
${zonesBlock}${profileBlock}${recentRaceBlock}
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
          primarySource: toSource("default"),
          injurySource: toSource("injury_single_run"),
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
  trainingPhase?: TrainingPhase
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Anthropic API key not configured");
  }

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 4096,
    system: buildSystemPrompt(units, trainingPhase),
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
  trainingPhase?: TrainingPhase
): Promise<TrainingPlan> {
  const phase =
    trainingPhase ??
    (weeksToRace !== undefined ? computeTrainingPhase(weeksToRace) : undefined);
  const text = await callClaude(userPrompt, units, phase);
  return parseTrainingPlanResponse(text, weeksToRace);
}

export async function evaluateCheckInAdjustments(
  checkins: CheckIn[],
  units: Units = "km"
) {
  const text = await callClaude(buildCheckInPrompt(checkins), units);
  return parseCheckInResponse(text);
}
