import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { DashboardTopBar } from "@/components/DashboardTopBar";
import { StatCards } from "@/components/StatCards";
import { CoachNudgeCard } from "@/components/CoachNudgeCard";
import { RecentRunsList } from "@/components/RecentRunsList";
import { computeWeeklyStats } from "@/lib/dashboard-stats";
import {
  fetchStravaActivities,
  processActivities,
} from "@/lib/strava";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.accessToken) {
    redirect("/");
  }

  const userName = session.user?.name ?? "Athlete";
  const userEmail = session.user?.email ?? undefined;

  let fetchFailed = false;
  let activities = [] as Awaited<ReturnType<typeof fetchStravaActivities>>;

  try {
    activities = await fetchStravaActivities(session.accessToken, 20, 300);
  } catch {
    fetchFailed = true;
  }

  const runs = fetchFailed ? [] : processActivities(activities);
  const weeklyStats = fetchFailed
    ? {
        totalKm: 0,
        avgPacePerKm: "--",
        runCount: 0,
        avgHeartRate: "--",
      }
    : computeWeeklyStats(activities);

  return (
    <AppShell userEmail={userEmail}>
      <DashboardTopBar userName={userName} />
      <main className="px-4 py-5 md:px-6 space-y-5 max-w-3xl">
        {fetchFailed ? (
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 text-center">
            <p className="text-[#71717a] text-sm">
              Could not load your runs. Try refreshing.
            </p>
          </div>
        ) : (
          <>
            <StatCards stats={weeklyStats} />
            <CoachNudgeCard />
            <RecentRunsList runs={runs} />
          </>
        )}
      </main>
    </AppShell>
  );
}
