import type { ProcessedRun, StravaActivity } from "@/types";
import type { Units } from "@/lib/units";

const STRAVA_API = "https://www.strava.com/api/v3";

export async function fetchStravaActivities(
  accessToken: string,
  limit = 20,
  revalidate = 0
): Promise<StravaActivity[]> {
  const response = await fetch(
    `${STRAVA_API}/athlete/activities?per_page=${limit}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      next: { revalidate },
    }
  );

  if (!response.ok) {
    throw new Error(`Strava API error: ${response.status}`);
  }

  const activities: StravaActivity[] = await response.json();
  return activities.filter((a) => a.type === "Run");
}

export function processActivities(activities: StravaActivity[]): ProcessedRun[] {
  return activities.map((activity) => {
    const distanceKm = activity.distance / 1000;
    const distanceMiles = distanceKm * 0.621371;
    const durationMinutes = activity.moving_time / 60;

    const paceSecsPerKm =
      distanceKm > 0 ? activity.moving_time / distanceKm : 0;
    const pacePerKm = formatPace(paceSecsPerKm);

    const paceSecsPerMile =
      distanceMiles > 0 ? activity.moving_time / distanceMiles : 0;
    const pacePerMile = formatPace(paceSecsPerMile);

    return {
      id: activity.id,
      name: activity.name,
      date: new Date(activity.start_date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      distanceKm: Math.round(distanceKm * 10) / 10,
      distanceMiles: Math.round(distanceMiles * 10) / 10,
      durationMinutes: Math.round(durationMinutes),
      pacePerKm,
      pacePerMile,
      elevationGainM: Math.round(activity.total_elevation_gain),
      avgHeartrate: activity.average_heartrate,
      maxHeartrate: activity.max_heartrate,
    };
  });
}

export function buildRunSummaryForAI(
  runs: ProcessedRun[],
  units: Units = "km"
): string {
  if (runs.length === 0) return "No recent runs found.";

  const lines = runs.slice(0, 12).map((run, i) => {
    const hr = run.avgHeartrate ? `, avg HR: ${run.avgHeartrate} bpm` : "";
    const elev =
      run.elevationGainM > 10 ? `, elevation: +${run.elevationGainM}m` : "";

    if (units === "mi") {
      return `${i + 1}. ${run.date} - ${run.distanceMiles} mi in ${run.durationMinutes}min (${run.pacePerMile}/mi${hr}${elev})`;
    }

    return `${i + 1}. ${run.date} - ${run.distanceKm}km in ${run.durationMinutes}min (${run.pacePerKm}/km${hr}${elev})`;
  });

  return `Recent runs (most recent first):\n${lines.join("\n")}`;
}

function formatPace(secsPerUnit: number): string {
  if (secsPerUnit === 0) return "--";
  const mins = Math.floor(secsPerUnit / 60);
  const secs = Math.round(secsPerUnit % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}