export interface InjuryOption {
  id: string;
  label: string;
  synonyms: string[];
}

export const INJURY_OPTIONS: InjuryOption[] = [
  { id: "knee_pain", label: "Knee pain", synonyms: ["knee", "kneecap", "patella"] },
  {
    id: "runners_knee",
    label: "Runner's knee",
    synonyms: ["patellofemoral", "pfps", "front knee"],
  },
  {
    id: "it_band",
    label: "IT band syndrome",
    synonyms: ["itb", "it band", "lateral knee", "outside knee"],
  },
  {
    id: "shin_splints",
    label: "Shin splints",
    synonyms: ["shin", "tibia", "medial tibial", "shin pain"],
  },
  {
    id: "stress_fracture",
    label: "Stress fracture",
    synonyms: ["stress fracture", "bone stress", "fracture"],
  },
  {
    id: "plantar_fasciitis",
    label: "Plantar fasciitis",
    synonyms: ["heel pain", "arch pain", "plantar", "fascia", "heel"],
  },
  {
    id: "ankle_sprain",
    label: "Ankle sprain",
    synonyms: ["ankle", "rolled ankle", "sprained ankle"],
  },
  {
    id: "achilles",
    label: "Achilles tendinopathy",
    synonyms: ["achilles", "heel cord", "back of ankle", "tendon"],
  },
  {
    id: "calf_strain",
    label: "Calf strain",
    synonyms: ["calf", "calves", "lower leg", "calf muscle"],
  },
  {
    id: "peroneal",
    label: "Peroneal tendinopathy",
    synonyms: ["peroneal", "outside ankle", "lateral ankle"],
  },
  {
    id: "hip_pain",
    label: "Hip pain",
    synonyms: ["hip", "hip pain", "hip flexor"],
  },
  {
    id: "glute_pain",
    label: "Glute pain or weakness",
    synonyms: ["glute", "buttock", "gluteal", "butt"],
  },
  {
    id: "piriformis",
    label: "Piriformis syndrome",
    synonyms: ["piriformis", "deep glute", "sciatica-like"],
  },
  {
    id: "hip_flexor",
    label: "Hip flexor tightness",
    synonyms: ["hip flexor", "psoas", "front hip", "groin"],
  },
  {
    id: "hamstring",
    label: "Hamstring strain or tightness",
    synonyms: ["hamstring", "back of thigh", "hammy", "thigh strain"],
  },
  {
    id: "quad",
    label: "Quad pain or tightness",
    synonyms: ["quad", "quadriceps", "front thigh", "thigh"],
  },
  {
    id: "lower_back",
    label: "Lower back pain",
    synonyms: ["lower back", "lumbar", "back pain", "back ache", "sacrum"],
  },
  {
    id: "general_fatigue",
    label: "General fatigue or overtraining",
    synonyms: ["tired", "fatigue", "burnout", "overtrained", "exhausted"],
  },
  {
    id: "shin_tightness",
    label: "Shin tightness",
    synonyms: ["shin tight", "lower leg tight"],
  },
  {
    id: "knee_swelling",
    label: "Knee swelling",
    synonyms: ["swollen knee", "knee swelling", "knee inflammation"],
  },
  { id: "blisters", label: "Blisters", synonyms: ["blister", "blisters", "foot blister"] },
  {
    id: "black_toenail",
    label: "Black toenail",
    synonyms: ["toenail", "black toe", "toenail pain"],
  },
  { id: "chafing", label: "Chafing", synonyms: ["chafe", "chafing", "skin irritation"] },
  {
    id: "side_stitch",
    label: "Side stitch",
    synonyms: ["stitch", "side pain", "side cramp", "rib pain"],
  },
  {
    id: "shin_bone_pain",
    label: "Shin bone pain",
    synonyms: ["bone pain", "shin bone"],
  },
  {
    id: "foot_pain",
    label: "General foot pain",
    synonyms: ["foot", "foot pain", "sore feet"],
  },
  {
    id: "knee_clicking",
    label: "Knee clicking or popping",
    synonyms: ["knee click", "knee pop", "clicking knee"],
  },
  {
    id: "hip_clicking",
    label: "Hip clicking",
    synonyms: ["hip click", "snapping hip", "hip pop"],
  },
  {
    id: "back_tightness",
    label: "Back tightness",
    synonyms: ["back tight", "stiff back", "back stiffness"],
  },
  {
    id: "neck_pain",
    label: "Neck or shoulder tension",
    synonyms: ["neck", "shoulder", "upper back", "neck pain"],
  },
  {
    id: "ankle_tightness",
    label: "Ankle tightness",
    synonyms: ["ankle tight", "stiff ankle", "ankle stiffness"],
  },
];

export const INJURY_OPTIONS_BY_ID: Record<string, InjuryOption> =
  Object.fromEntries(INJURY_OPTIONS.map((option) => [option.id, option]));

export const CURATED_INJURY_IDS = new Set(INJURY_OPTIONS.map((option) => option.id));

export function getInjuryDisplayLabel(value: string): string {
  return INJURY_OPTIONS_BY_ID[value]?.label ?? value;
}

export function isCuratedInjuryId(value: string): boolean {
  return CURATED_INJURY_IDS.has(value);
}

interface ScoredOption {
  option: InjuryOption;
  score: number;
}

export function searchInjuryOptions(
  query: string,
  selectedIds: Set<string>,
  limit = 8
): InjuryOption[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  const scored: ScoredOption[] = [];

  for (const option of INJURY_OPTIONS) {
    if (selectedIds.has(option.id)) continue;

    const label = option.label.toLowerCase();
    let score = 0;

    if (label.startsWith(trimmed)) {
      score = 100;
    } else if (label.includes(trimmed)) {
      score = 80;
    } else {
      for (const synonym of option.synonyms) {
        const syn = synonym.toLowerCase();
        if (syn.startsWith(trimmed)) {
          score = Math.max(score, 70);
        } else if (syn.includes(trimmed)) {
          score = Math.max(score, 50);
        }
      }
    }

    if (score > 0) {
      scored.push({ option, score });
    }
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.option.label.localeCompare(b.option.label);
  });

  return scored.slice(0, limit).map((entry) => entry.option);
}
