import type { UserProfile } from "@/types/profile";
import { INJURY_OPTIONS_BY_ID } from "@/lib/injury-options";

export interface PersonalizedRecommendation {
  text: string;
  applicableWhen?: string;
  priority: "primary" | "secondary";
}

export interface InjuryAlert {
  bodyPart: string;
  condition: string;
  severity: "monitor" | "modify" | "stop";
  immediateAction: string;
  recommendations: PersonalizedRecommendation[];
  redFlag: string;
  detectedIn: string;
}

interface InjuryDefinition {
  bodyPart: string;
  keywords: string[];
  condition: string;
  severity: "monitor" | "modify" | "stop";
  immediateAction: string;
  recommendations: PersonalizedRecommendation[];
  redFlag: string;
}

const INJURY_DEFINITIONS: InjuryDefinition[] = [
  {
    bodyPart: "Knee",
    keywords: [
      "knee", "kneecap", "patella", "runner's knee", "it band", "itb",
      "lateral knee", "outside knee", "inside knee", "knee cap",
    ],
    condition: "Possible runner's knee or IT band syndrome",
    severity: "modify",
    immediateAction:
      "Reduce mileage by 30-50%. Avoid downhill running this week.",
    recommendations: [
      { text: "Hip abductor strengthening: clamshells, lateral band walks (3x15 daily)", applicableWhen: "all", priority: "primary" },
      { text: "Foam roll IT band and glutes 2-3 minutes each side after runs", applicableWhen: "all", priority: "primary" },
      { text: "Check running cadence. Aim for 170-180 steps per minute to reduce knee loading", applicableWhen: "all", priority: "primary" },
      { text: "Yoga hip openers: pigeon pose, figure-4 stretch daily. Reduces IT band tension", applicableWhen: "all", priority: "secondary" },
      { text: "Extra rest day between runs. Recovery is slower after 40", applicableWhen: "age >= 40", priority: "primary" },
      { text: "Focus on glute activation before every run. Hip weakness is more pronounced in beginners", applicableWhen: "beginner", priority: "primary" },
      { text: "Pelvic floor and hip stability work before returning to running impact", applicableWhen: "postpartum", priority: "primary" },
      { text: "See a sports physio if pain persists more than 7 days", applicableWhen: "all", priority: "primary" },
    ],
    redFlag:
      "Stop running if pain is sharp, constant, or present while walking",
  },
  {
    bodyPart: "Shin",
    keywords: [
      "shin", "tibia", "shin splints", "lower leg", "front of leg",
      "medial tibial", "shins",
    ],
    condition: "Possible shin splints (medial tibial stress syndrome)",
    severity: "modify",
    immediateAction: "Do not run through shin pain. Reduce mileage immediately.",
    recommendations: [
      { text: "Ice shins 15-20 minutes after runs during recovery", applicableWhen: "all", priority: "primary" },
      { text: "Calf raises and toe raises (tibialis anterior) to strengthen lower leg", applicableWhen: "all", priority: "primary" },
      { text: "Run on softer surfaces: grass, trail, treadmill, until resolved", applicableWhen: "all", priority: "primary" },
      { text: "Check shoe mileage. Worn cushioning is a leading cause of shin splints", applicableWhen: "all", priority: "secondary" },
      { text: "Pool running or elliptical maintains fitness with zero impact while shins recover", applicableWhen: "all", priority: "secondary" },
      { text: "New runners are most vulnerable to shin splints. Reduce volume by 40% not 30%", applicableWhen: "beginner", priority: "primary" },
      { text: "Bone density is lower in some postpartum athletes. Rule out stress fracture with a physio", applicableWhen: "postpartum", priority: "primary" },
      { text: "Osteoporosis increases stress fracture risk. See a doctor before resuming running", applicableWhen: "osteoporosis", priority: "primary" },
    ],
    redFlag:
      "If pain is present at rest, gets worse during the run, or feels like bone pain, stop immediately. Could be a stress fracture.",
  },
  {
    bodyPart: "Calf/Achilles",
    keywords: [
      "calf", "calves", "achilles", "heel cord", "back of ankle", "tendon",
      "achilles tendon", "achilles tendinitis", "tendinopathy",
    ],
    condition: "Possible calf strain or Achilles tendinopathy",
    severity: "modify",
    immediateAction:
      "Avoid speed work, hills, and sudden acceleration. Easy running only or rest.",
    recommendations: [
      { text: "Eccentric calf raises (Alfredson protocol): 3x15 straight leg + 3x15 bent knee daily on a step", applicableWhen: "all", priority: "primary" },
      { text: "Ice after runs. Never massage directly on the Achilles tendon.", applicableWhen: "all", priority: "primary" },
      { text: "No static Achilles stretching in acute phase. Load it eccentrically instead", applicableWhen: "all", priority: "primary" },
      { text: "Avoid sudden increases in hill running, speed work, or jumping", applicableWhen: "all", priority: "secondary" },
      { text: "Tendons take longer to adapt after 40. Expect 8-12 weeks of loading before full recovery", applicableWhen: "age >= 40", priority: "primary" },
      { text: "Masters runners: switch to a 10-day training cycle to allow full Achilles recovery between sessions", applicableWhen: "age >= 50", priority: "primary" },
      { text: "Collagen synthesis is slower postpartum. Do not rush return to impact", applicableWhen: "postpartum", priority: "primary" },
    ],
    redFlag:
      "A sudden sharp pop or inability to push off your foot is a medical emergency. Go to urgent care immediately",
  },
  {
    bodyPart: "Plantar",
    keywords: [
      "heel", "arch", "plantar", "bottom of foot", "heel pain",
      "first steps morning", "fascia", "plantar fasciitis", "foot pain",
    ],
    condition: "Possible plantar fasciitis",
    severity: "modify",
    immediateAction:
      "Reduce mileage. Never walk barefoot on hard floors while symptomatic.",
    recommendations: [
      { text: "Frozen water bottle rolling under arch for 5 minutes morning and evening", applicableWhen: "all", priority: "primary" },
      { text: "Calf and plantar fascia stretches before your first steps each morning", applicableWhen: "all", priority: "primary" },
      { text: "Supportive footwear at all times. No flip flops, flat shoes, or barefoot on hard floors", applicableWhen: "all", priority: "primary" },
      { text: "Towel scrunches and single-leg calf raises with slight knee bend to strengthen arch", applicableWhen: "all", priority: "secondary" },
      { text: "Night splint or plantar fasciitis sock keeps fascia stretched overnight. Reduces morning pain", applicableWhen: "all", priority: "secondary" },
      { text: "Heavier body weight increases plantar load. Pool running and cycling are good alternatives", applicableWhen: "all", priority: "secondary" },
      { text: "Plantar fasciitis is more common postpartum due to relaxin hormone. See a podiatrist early", applicableWhen: "postpartum", priority: "primary" },
      { text: "Gait analysis to check for overpronation. Orthotics may help", applicableWhen: "all", priority: "secondary" },
    ],
    redFlag:
      "Plantar fasciitis resolves in 95% of cases with conservative treatment but takes 6-18 months. See a podiatrist if no improvement after 6 weeks.",
  },
  {
    bodyPart: "Hip",
    keywords: [
      "hip", "glute", "piriformis", "hip flexor", "groin", "psoas",
      "buttock", "outer hip", "hip pain", "glute pain",
    ],
    condition: "Possible hip flexor tightness or glute weakness",
    severity: "monitor",
    immediateAction:
      "Reduce intensity. No long threshold sessions until resolved.",
    recommendations: [
      { text: "Hip flexor stretches: low lunge 3x30 seconds each side daily", applicableWhen: "all", priority: "primary" },
      { text: "Glute activation before every run: glute bridges, single-leg deadlifts, clamshells", applicableWhen: "all", priority: "primary" },
      { text: "Single-leg squats and lateral band walks to build hip stability", applicableWhen: "all", priority: "primary" },
      { text: "Check running posture. Forward lean reduces glute activation", applicableWhen: "all", priority: "secondary" },
      { text: "Pelvic floor and deep hip stability work is essential before increasing mileage", applicableWhen: "postpartum", priority: "primary" },
      { text: "Hip mobility decreases with age. Prioritize daily mobility work not just before runs", applicableWhen: "age >= 50", priority: "primary" },
    ],
    redFlag:
      "Hip pain with clicking, giving way, or pain groin area radiating down the leg should be evaluated by a sports physio or orthopaedic doctor",
  },
  {
    bodyPart: "Hamstring",
    keywords: [
      "hamstring", "back of thigh", "pulled muscle", "upper leg back",
      "thigh strain", "hamstring strain", "back of leg", "hammy",
    ],
    condition: "Possible hamstring strain or tightness",
    severity: "modify",
    immediateAction:
      "Rest completely for 48-72 hours after any strain. Do not stretch an acutely strained muscle.",
    recommendations: [
      { text: "Progressive loading once acute pain resolves, not stretching. Start with gentle bridges.", applicableWhen: "all", priority: "primary" },
      { text: "Nordic hamstring curls when back to training. Proven to reduce recurrence by 51%", applicableWhen: "all", priority: "primary" },
      { text: "Avoid sudden sprinting, hill repeats, or intervals until fully recovered", applicableWhen: "all", priority: "primary" },
      { text: "Eccentric exercises more effective than static stretching for hamstring rehab", applicableWhen: "all", priority: "secondary" },
      { text: "Hamstring strains recur easily after 40. Do not rush return to speed work", applicableWhen: "age >= 40", priority: "primary" },
    ],
    redFlag:
      "A sharp pull during a run needs 48-72 hours rest and assessment. If bruising appears seek medical advice.",
  },
  {
    bodyPart: "Ankle",
    keywords: [
      "ankle", "rolled ankle", "sprain", "outside ankle", "peroneal",
      "ankle bone", "twisted ankle", "ankle pain",
    ],
    condition: "Possible ankle sprain or peroneal strain",
    severity: "modify",
    immediateAction:
      "RICE for first 48 hours: rest, ice, compression, elevation.",
    recommendations: [
      { text: "Balance and proprioception: single-leg standing with eyes closed, wobble board", applicableWhen: "all", priority: "primary" },
      { text: "Resistance band: ankle circles, eversion, dorsiflexion exercises", applicableWhen: "all", priority: "primary" },
      { text: "Avoid uneven terrain until ankle strength is fully restored", applicableWhen: "all", priority: "primary" },
      { text: "Trail running requires ankle strengthening before returning after a sprain", applicableWhen: "all", priority: "secondary" },
      { text: "Proprioception takes longer to restore after 50. Continue balance work for 3 months minimum", applicableWhen: "age >= 50", priority: "primary" },
    ],
    redFlag:
      "Cannot bear weight or significant swelling after a roll. Get an X-ray to rule out fracture before running again",
  },
  {
    bodyPart: "Fatigue",
    keywords: [
      "tired", "exhausted", "burned out", "overtrained", "no energy",
      "heavy legs", "dead legs", "flat", "sluggish", "drained",
      "fatigued", "worn out",
    ],
    condition: "Signs of accumulated fatigue or overreaching",
    severity: "monitor",
    immediateAction:
      "Reduce volume by 30% this week. Sleep is the most powerful recovery tool.",
    recommendations: [
      { text: "Sleep 8+ hours. Performance drops measurably with under 7 hours.", applicableWhen: "all", priority: "primary" },
      { text: "Check carbohydrate intake. Endurance athletes often under-fuel which causes fatigue", applicableWhen: "all", priority: "primary" },
      { text: "Consider a deload week. Reduce all training by 30-40% before resuming normal load", applicableWhen: "all", priority: "primary" },
      { text: "Check HRV trend if available. Consistently low HRV confirms need for recovery week", applicableWhen: "all", priority: "secondary" },
      { text: "Breathing exercises (physiological sigh, box breathing) activate parasympathetic nervous system and improve recovery", applicableWhen: "all", priority: "secondary" },
      { text: "Cold water immersion 10-15 minutes post hard session reduces muscle soreness", applicableWhen: "all", priority: "secondary" },
      { text: "Recovery takes longer after 40. Persistent fatigue is a signal to reduce, not push through", applicableWhen: "age >= 40", priority: "primary" },
      { text: "Postpartum fatigue compounds training fatigue. Prioritize sleep over every training session.", applicableWhen: "postpartum", priority: "primary" },
    ],
    redFlag:
      "Persistent fatigue for more than 2 weeks with no improvement, or fatigue accompanied by illness, should be evaluated by a doctor. Could be overtraining syndrome, anemia, or thyroid issues.",
  },
  {
    bodyPart: "Lower back",
    keywords: [
      "lower back", "back pain", "lumbar", "back ache", "sacrum",
      "spine", "back stiffness",
    ],
    condition: "Lower back tightness or pain during running",
    severity: "monitor",
    immediateAction:
      "Avoid speed work and intervals until resolved. Focus on core activation.",
    recommendations: [
      { text: "Core strengthening: dead bugs, bird dogs, pallof press. Not crunches", applicableWhen: "all", priority: "primary" },
      { text: "Hip flexor stretching daily. Tight hip flexors pull the lower back into extension", applicableWhen: "all", priority: "primary" },
      { text: "Check running posture. Forward lean from the ankles not the waist", applicableWhen: "all", priority: "secondary" },
      { text: "Glute activation before runs reduces lumbar loading", applicableWhen: "all", priority: "secondary" },
      { text: "Diastasis recti (abdominal separation) is common postpartum and causes lower back pain. See a pelvic physio", applicableWhen: "postpartum", priority: "primary" },
      { text: "Bone density decreases with age. Persistent back pain after 50 should be evaluated", applicableWhen: "age >= 50", priority: "primary" },
    ],
    redFlag:
      "Back pain radiating down one or both legs, numbness, or bladder changes requires immediate medical evaluation.",
  },
];

const INJURY_ID_TO_CATEGORY: Record<string, string> = {
  knee_pain: "knee",
  runners_knee: "knee",
  it_band: "knee",
  knee_swelling: "knee",
  knee_clicking: "knee",
  shin_splints: "shin",
  stress_fracture: "shin",
  shin_tightness: "shin",
  shin_bone_pain: "shin",
  plantar_fasciitis: "plantar",
  foot_pain: "plantar",
  ankle_sprain: "ankle",
  peroneal: "ankle",
  ankle_tightness: "ankle",
  achilles: "calf_achilles",
  calf_strain: "calf_achilles",
  hip_pain: "hip",
  glute_pain: "hip",
  piriformis: "hip",
  hip_flexor: "hip",
  hip_clicking: "hip",
  hamstring: "hamstring",
  lower_back: "lower_back",
  back_tightness: "lower_back",
  general_fatigue: "fatigue",
};

const CATEGORY_TO_BODY_PART: Record<string, string> = {
  knee: "Knee",
  shin: "Shin",
  plantar: "Plantar",
  ankle: "Ankle",
  calf_achilles: "Calf/Achilles",
  hip: "Hip",
  hamstring: "Hamstring",
  lower_back: "Lower back",
  fatigue: "Fatigue",
};

const LEGACY_INJURY_PHRASES: Record<string, string> = {
  knee_pain: "knee pain",
  shin_pain: "shin pain",
  heel_arch: "heel arch plantar fasciitis",
  achilles_calf: "achilles calf tightness",
  hip: "hip tightness",
  hamstring: "hamstring tightness",
  lower_back: "lower back pain",
  fatigue: "fatigue tired heavy legs",
};

function getDefinitionForBodyPart(bodyPart: string): InjuryDefinition | undefined {
  return INJURY_DEFINITIONS.find((def) => def.bodyPart === bodyPart);
}

function buildAlertFromDefinition(
  def: InjuryDefinition,
  detectedIn: string,
  profile: UserProfile
): InjuryAlert {
  return {
    bodyPart: def.bodyPart,
    condition: def.condition,
    severity: def.severity,
    immediateAction: def.immediateAction,
    recommendations: filterRecommendations(def.recommendations, profile),
    redFlag: def.redFlag,
    detectedIn,
  };
}

function alertsFromProfileInjuries(profile: UserProfile): InjuryAlert[] {
  const alerts: InjuryAlert[] = [];
  const seenBodyParts = new Set<string>();

  for (const injuryId of profile.currentInjuries ?? []) {
    const category = INJURY_ID_TO_CATEGORY[injuryId];
    if (!category) continue;

    const bodyPart = CATEGORY_TO_BODY_PART[category];
    if (!bodyPart || seenBodyParts.has(bodyPart)) continue;

    const def = getDefinitionForBodyPart(bodyPart);
    if (!def) continue;

    const option = INJURY_OPTIONS_BY_ID[injuryId];
    const detectedIn = option?.label ?? injuryId;

    seenBodyParts.add(bodyPart);
    alerts.push(buildAlertFromDefinition(def, detectedIn, profile));
  }

  return alerts;
}

function isPostpartum(profile: UserProfile): boolean {
  const status = profile.perinatalStatus;
  return (
    status === "pregnant" ||
    status === "postpartum" ||
    status === "postpartum_under_6" ||
    status === "postpartum_6_12"
  );
}

function matchesApplicableWhen(
  when: string | undefined,
  profile: UserProfile
): boolean {
  if (!when || when === "all") return true;
  try {
    if (when === "beginner") {
      return profile.runningExperience === "just_starting";
    }
    if (when === "postpartum") {
      return isPostpartum(profile);
    }
    if (when === "osteoporosis") {
      return profile.healthConditions?.includes("osteoporosis") ?? false;
    }
    if (when === "age >= 40") {
      return (profile.age ?? 0) >= 40;
    }
    if (when === "age >= 50") {
      return (profile.age ?? 0) >= 50;
    }
  } catch {
    return false;
  }
  return false;
}

function filterRecommendations(
  recs: PersonalizedRecommendation[],
  profile: UserProfile
): PersonalizedRecommendation[] {
  try {
    const filtered = recs.filter((rec) =>
      matchesApplicableWhen(rec.applicableWhen, profile)
    );
    filtered.sort((a, b) => {
      if (a.priority === b.priority) return 0;
      return a.priority === "primary" ? -1 : 1;
    });
    return filtered.slice(0, 5);
  } catch {
    return recs.filter((r) => r.applicableWhen === "all").slice(0, 5);
  }
}

function findKeywordSnippet(text: string, keyword: string): string {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(keyword.toLowerCase());
  if (idx === -1) return text.slice(0, 80);
  const start = Math.max(0, idx - 20);
  const end = Math.min(text.length, idx + keyword.length + 40);
  return text.slice(start, end).trim();
}

export function profileInjuryNotes(profile: UserProfile): string[] {
  const notes: string[] = [];
  for (const injury of profile.currentInjuries ?? []) {
    const option = INJURY_OPTIONS_BY_ID[injury];
    if (option) {
      notes.push(option.label);
      continue;
    }
    const legacyPhrase = LEGACY_INJURY_PHRASES[injury];
    if (legacyPhrase) {
      notes.push(legacyPhrase);
      continue;
    }
    if (injury !== "none" && injury !== "other") {
      notes.push(injury);
    }
  }
  return notes;
}

export function detectInjuries(
  notes: string[],
  profile: UserProfile
): InjuryAlert[] {
  try {
    const alerts = alertsFromProfileInjuries(profile);
    const seenBodyParts = new Set(alerts.map((alert) => alert.bodyPart));

    const profileNotes = profileInjuryNotes(profile);
    const combined = [...notes, ...profileNotes].filter(Boolean).join(" ");
    if (!combined.trim()) return alerts;

    const lowerCombined = combined.toLowerCase();

    for (const def of INJURY_DEFINITIONS) {
      if (seenBodyParts.has(def.bodyPart)) continue;

      let matchedKeyword: string | null = null;
      for (const keyword of def.keywords) {
        if (lowerCombined.includes(keyword.toLowerCase())) {
          matchedKeyword = keyword;
          break;
        }
      }
      if (!matchedKeyword) continue;

      seenBodyParts.add(def.bodyPart);
      alerts.push(
        buildAlertFromDefinition(
          def,
          findKeywordSnippet(combined, matchedKeyword),
          profile
        )
      );
    }

    return alerts;
  } catch (error) {
    console.warn("Injury detection failed:", error);
    return [];
  }
}

export function buildInjuryPromptSection(alerts: InjuryAlert[]): string {
  if (alerts.length === 0) return "";

  const blocks = alerts.map((alert, index) => {
    const recLines = alert.recommendations
      .map((rec, i) => `    ${i + 1}. ${rec.text}`)
      .join("\n");
    return `  Alert ${index + 1}:
  Signal: ${alert.condition} (severity: ${alert.severity})
  Detected in: '${alert.detectedIn}'
  Immediate adjustment: ${alert.immediateAction}
  Personalized recommendations for this athlete:
${recLines}
  Red flag: ${alert.redFlag}`;
  });

  return `INJURY AND RECOVERY SIGNALS:
${blocks.join("\n\n")}

Coach must:
- Reduce intensity or volume on affected days
- Avoid aggravating movements in the prescribed plan
- Include the top recommendation in generalAdvice
- Add the red flag as a warningFlag if severity is 'stop'
- Always end injury advice with: 'These are training adjustments, not medical advice. See a sports physio for persistent or worsening symptoms.'

SAFETY: Claude must never diagnose. Use 'possible', 'signs of', 'may indicate'. Never tell the athlete to run through pain.`;
}

const PAIN_LOCATION_PHRASES: Record<string, string> = {
  knee: "knee pain",
  shin: "shin pain",
  calf_achilles: "achilles calf pain",
  heel_arch: "heel arch plantar pain",
  hip: "hip pain",
  hamstring: "hamstring pain",
  ankle: "ankle pain",
  lower_back: "lower back pain",
  other: "pain discomfort",
};

export function checkInToInjuryNotes(
  notes?: string,
  painLevel?: string,
  painLocations?: string[]
): string[] {
  const result: string[] = [];
  if (notes?.trim()) result.push(notes.trim());
  if (painLevel && painLevel !== "none" && painLocations?.length) {
    for (const loc of painLocations) {
      const phrase = PAIN_LOCATION_PHRASES[loc] ?? loc;
      result.push(`${phrase} ${painLevel}`);
    }
  }
  return result;
}
