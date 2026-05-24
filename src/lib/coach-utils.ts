const ZONE_EXPLANATIONS: Record<string, string> = {
  "zone 1":
    "Zone 1 means 50 to 60 percent of your max heart rate. Very easy effort used for warm ups and recovery. You should feel like you could go all day.",
  "zone 2":
    "Zone 2 means 60 to 70 percent of your max heart rate. You should be able to hold a full conversation. This is where your aerobic base gets built.",
  "zone 3":
    "Zone 3 means 70 to 80 percent of your max heart rate. Breathing is noticeable but you can still speak in short sentences. Builds aerobic capacity and stamina.",
  "zone 4":
    "Zone 4 means 80 to 90 percent of your max heart rate. Hard effort where talking is difficult. Improves lactate threshold and race pace tolerance.",
  "zone 5":
    "Zone 5 means 90 to 100 percent of your max heart rate. Maximum effort for short intervals. Builds top-end speed and VO2 max.",
  threshold:
    "Threshold pace is the fastest pace you can hold for about 60 minutes. Breathing is hard but controlled. Training here raises your lactate threshold which is the key to racing faster.",
  tempo:
    "Tempo pace is comfortably hard, often near half marathon effort. You can speak a few words at a time. It teaches your body to clear lactate while running fast.",
  "easy pace":
    "Easy pace should feel relaxed. You should finish feeling like you could run more. Most of your weekly mileage should be at this effort.",
  "long run pace":
    "Long run pace is easy to moderate. The goal is time on feet, not speed. Stay controlled so you can finish strong and recover within a day or two.",
  "marathon pace":
    "Marathon pace is the speed you aim to hold for 26.2 miles. It should feel steady but challenging in the later miles of a long run.",
  "half marathon pace":
    "Half marathon pace is the speed you could hold for about 90 minutes. It is faster than easy pace but slower than threshold.",
  "interval pace":
    "Interval pace is fast and hard, usually 3K to 5K race effort. Recover fully between reps. The goal is quality, not quantity.",
  recovery:
    "Recovery pace is very easy jogging or walking. The only goal is to promote blood flow and help your legs bounce back for the next hard session.",
};

function normalizeZoneKey(zone: string): string {
  return zone.trim().toLowerCase().replace(/\s+/g, " ");
}

export function getZoneExplanation(zone: string): string {
  const key = normalizeZoneKey(zone);

  if (ZONE_EXPLANATIONS[key]) {
    return ZONE_EXPLANATIONS[key];
  }

  for (const [mapKey, explanation] of Object.entries(ZONE_EXPLANATIONS)) {
    if (key.includes(mapKey)) {
      return explanation;
    }
  }

  const zoneMatch = key.match(/zone\s*(\d)/);
  if (zoneMatch) {
    const zoneKey = `zone ${zoneMatch[1]}`;
    if (ZONE_EXPLANATIONS[zoneKey]) {
      return ZONE_EXPLANATIONS[zoneKey];
    }
  }

  return zone;
}

export function computeWeekSubtitle(raceDate: string): string {
  if (!raceDate) {
    return "Set your race goal below";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const race = new Date(raceDate);
  race.setHours(0, 0, 0, 0);

  const daysUntilRace = Math.ceil(
    (race.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilRace < 0) {
    return "Your race date has passed. Set a new goal below.";
  }

  const totalWeeks = Math.max(1, Math.ceil(daysUntilRace / 7));
  const currentWeek = Math.min(
    totalWeeks,
    Math.max(1, totalWeeks - Math.floor((daysUntilRace - 1) / 7))
  );

  return `Week ${currentWeek} of ${totalWeeks} to race day`;
}

export function computeWeeksUntilRace(raceDate: string): number {
  if (!raceDate) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const race = new Date(raceDate);
  race.setHours(0, 0, 0, 0);

  const daysUntilRace = Math.ceil(
    (race.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  return Math.max(0, Math.ceil(daysUntilRace / 7));
}

export function computeWeeksAgo(pastDate: string): number {
  if (!pastDate) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const past = new Date(pastDate);
  past.setHours(0, 0, 0, 0);

  const daysAgo = Math.floor(
    (today.getTime() - past.getTime()) / (1000 * 60 * 60 * 24)
  );

  return Math.max(0, Math.floor(daysAgo / 7));
}

const RECENT_RACE_DISTANCE_LABELS: Record<string, string> = {
  "5k": "5K",
  "10k": "10K",
  "15k": "15K",
  half: "Half marathon",
  marathon: "Marathon",
  other: "Other",
};

export function formatRecentRaceDistanceLabel(distanceKey?: string): string {
  if (!distanceKey) return "unspecified distance";
  return RECENT_RACE_DISTANCE_LABELS[distanceKey] ?? distanceKey;
}

export function buildRecentRacePrompt(params: {
  recentRaceDate?: string;
  recentRaceDistance?: string;
  recentRaceTime?: string;
}): string | undefined {
  const { recentRaceDate, recentRaceDistance, recentRaceTime } = params;

  if (!recentRaceDistance?.trim() || !recentRaceTime?.trim()) {
    return undefined;
  }

  const distanceLabel = formatRecentRaceDistanceLabel(recentRaceDistance);
  const time = recentRaceTime.trim();
  const datePart = recentRaceDate?.trim()
    ? ` on ${recentRaceDate.trim()}`
    : "";

  let weeksPart = "";
  let staleWarning = "";
  if (recentRaceDate?.trim()) {
    const weeksAgo = computeWeeksAgo(recentRaceDate.trim());
    weeksPart = ` (${weeksAgo} week${weeksAgo === 1 ? "" : "s"} ago)`;
    if (weeksAgo > 16) {
      staleWarning =
        "\nThis result is over 16 weeks old. Treat paces as rough estimates only and weight recent training data more heavily.";
    }
  }

  return `Recent race/effort: ${distanceLabel} in ${time}${datePart}${weeksPart}
Use this as the primary basis for VDOT pace zones.${staleWarning}`;
}
