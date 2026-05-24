"use client";

import type { HealthCondition } from "@/types/profile";

export const HEALTH_CONDITION_OPTIONS: {
  value: HealthCondition;
  label: string;
}[] = [
  { value: "type_1_diabetes", label: "Type 1 Diabetes" },
  { value: "type_2_diabetes", label: "Type 2 Diabetes" },
  { value: "high_blood_pressure", label: "High blood pressure" },
  { value: "asthma", label: "Asthma" },
  { value: "heart_condition", label: "Heart condition" },
  { value: "osteoporosis", label: "Osteoporosis" },
  { value: "autoimmune", label: "Autoimmune condition" },
  { value: "anemia", label: "Anemia or iron deficiency" },
  { value: "thyroid_condition", label: "Thyroid condition" },
  { value: "pcos", label: "PCOS" },
  { value: "previous_stress_fracture", label: "Previous stress fracture" },
  {
    value: "chronic_pain",
    label: "Chronic pain condition (fibromyalgia, arthritis, etc.)",
  },
  {
    value: "mental_health",
    label: "Mental health condition (anxiety, depression, etc.)",
  },
  { value: "none", label: "None" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

interface HealthConditionsFieldsProps {
  value?: HealthCondition[];
  onChange: (healthConditions: HealthCondition[] | undefined) => void;
  disabled?: boolean;
  showLabel?: boolean;
  label?: string;
  subtext?: string;
}

export function HealthConditionsFields({
  value,
  onChange,
  disabled = false,
  showLabel = true,
  label = "Any health conditions we should know about?",
  subtext,
}: HealthConditionsFieldsProps) {
  const selected = value ?? [];

  function toggleHealthCondition(condition: HealthCondition) {
    if (condition === "none") {
      onChange(["none"]);
      return;
    }
    if (condition === "prefer_not_to_say") {
      onChange(["prefer_not_to_say"]);
      return;
    }
    const filtered = selected.filter(
      (c) => c !== "none" && c !== "prefer_not_to_say"
    );
    const next = filtered.includes(condition)
      ? filtered.filter((c) => c !== condition)
      : [...filtered, condition];
    onChange(next.length > 0 ? next : undefined);
  }

  return (
    <div>
      {showLabel && (
        <>
          <p className="block text-sm text-[#71717a] mb-1.5">{label}</p>
          {subtext && <p className="text-xs text-[#71717a] mb-2">{subtext}</p>}
        </>
      )}
      <div className="flex flex-wrap gap-2">
        {HEALTH_CONDITION_OPTIONS.map((opt) => {
          const isSelected = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => toggleHealthCondition(opt.value)}
              className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
                isSelected
                  ? "border-[#f97316] bg-[#f97316]/10 text-white"
                  : "border-[#27272a] text-[#71717a] hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
