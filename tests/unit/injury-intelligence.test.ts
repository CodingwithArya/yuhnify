import { describe, expect, it } from "vitest";
import { detectInjuries } from "@/lib/injury-intelligence";
import { EMPTY_PROFILE, type UserProfile } from "@/types/profile";

const emptyProfile: UserProfile = { ...EMPTY_PROFILE, units: "mi" };

describe("detectInjuries keyword matching", () => {
  it("matches keywords case-insensitively", () => {
    const alerts = detectInjuries(["KNEE felt sore after the run"], emptyProfile);
    expect(alerts.some((alert) => alert.bodyPart === "Knee")).toBe(true);
  });

  it("returns a knee alert when knee is mentioned in notes", () => {
    const alerts = detectInjuries(["knee felt tight"], emptyProfile);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].bodyPart).toBe("Knee");
  });

  it("returns no alerts when no injury keywords are present", () => {
    expect(detectInjuries(["felt great today"], emptyProfile)).toEqual([]);
  });

  it("returns an empty array for empty notes input", () => {
    expect(detectInjuries([], emptyProfile)).toEqual([]);
  });

  it("returns a knee alert from profile injury selection without note text", () => {
    const profile: UserProfile = {
      ...emptyProfile,
      currentInjuries: ["it_band"],
    };
    const alerts = detectInjuries([], profile);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].bodyPart).toBe("Knee");
    expect(alerts[0].detectedIn).toBe("IT band syndrome");
  });

  it("returns an empty array when all note entries are blank", () => {
    expect(detectInjuries(["", "   "], emptyProfile)).toEqual([]);
  });
});

describe("detectInjuries personalized recommendations", () => {
  it("includes beginner-specific recommendations when experience is just_starting", () => {
    const profile: UserProfile = {
      ...emptyProfile,
      runningExperience: "just_starting",
    };
    const alerts = detectInjuries(["knee pain"], profile);
    expect(alerts).toHaveLength(1);
    const texts = alerts[0].recommendations.map((rec) => rec.text.toLowerCase());
    expect(texts.some((text) => text.includes("beginner"))).toBe(true);
  });

  it("includes age-specific recommendations when age is exactly 40", () => {
    const profile: UserProfile = { ...emptyProfile, age: 40 };
    const alerts = detectInjuries(["knee pain"], profile);
    expect(alerts).toHaveLength(1);
    const texts = alerts[0].recommendations.map((rec) => rec.text);
    expect(texts.some((text) => text.includes("after 40"))).toBe(true);
  });

  it("includes age-specific recommendations when age is above 40", () => {
    const profile: UserProfile = { ...emptyProfile, age: 41 };
    const alerts = detectInjuries(["knee pain"], profile);
    expect(alerts).toHaveLength(1);
    const texts = alerts[0].recommendations.map((rec) => rec.text);
    expect(texts.some((text) => text.includes("after 40"))).toBe(true);
  });

  it("excludes age-specific recommendations when age is just below 40", () => {
    const profile: UserProfile = { ...emptyProfile, age: 39 };
    const alerts = detectInjuries(["knee pain"], profile);
    expect(alerts).toHaveLength(1);
    const texts = alerts[0].recommendations.map((rec) => rec.text);
    expect(texts.some((text) => text.includes("after 40"))).toBe(false);
  });

  it("includes postpartum-specific recommendations when perinatal status is postpartum", () => {
    const profile: UserProfile = {
      ...emptyProfile,
      perinatalStatus: "postpartum_under_6",
    };
    const alerts = detectInjuries(["knee pain"], profile);
    expect(alerts).toHaveLength(1);
    const texts = alerts[0].recommendations.map((rec) => rec.text.toLowerCase());
    expect(texts.some((text) => text.includes("pelvic floor"))).toBe(true);
  });

  it("returns only general recommendations when profile fields are empty", () => {
    const alerts = detectInjuries(["knee pain"], emptyProfile);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].recommendations.length).toBeGreaterThan(0);
    for (const rec of alerts[0].recommendations) {
      expect(rec.applicableWhen === "all" || rec.applicableWhen === undefined).toBe(
        true
      );
    }
  });

  it("caps recommendations at five items per alert", () => {
    const profile: UserProfile = {
      ...emptyProfile,
      age: 50,
      runningExperience: "just_starting",
      perinatalStatus: "postpartum_6_12",
    };
    const alerts = detectInjuries(["knee pain"], profile);
    expect(alerts[0].recommendations.length).toBeLessThanOrEqual(5);
  });
});
