import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { DashboardTopBar } from "@/components/DashboardTopBar";
import { DashboardContent } from "@/components/DashboardContent";
import { UnitsGuard } from "@/components/UnitsGuard";
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
      <UnitsGuard userId={session.user?.id ?? session.user?.email ?? "athlete"}>
        <DashboardTopBar userName={userName} />
        <main className="px-4 py-5 md:px-6 space-y-5 max-w-3xl">
          <DashboardContent
            fetchFailed={fetchFailed}
            weeklyStats={weeklyStats}
            runs={runs}
          />
        </main>
      </UnitsGuard>
    </AppShell>
  );
}
