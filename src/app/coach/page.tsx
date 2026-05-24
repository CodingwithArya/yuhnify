import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { DashboardTopBar } from "@/components/DashboardTopBar";
import { CoachPageContent } from "@/components/coach/CoachPageContent";
import { UnitsGuard } from "@/components/UnitsGuard";
import {
  fetchStravaActivities,
  processActivities,
} from "@/lib/strava";

export default async function CoachPage() {
  const session = await auth();

  if (!session?.accessToken) {
    redirect("/");
  }

  const userName = session.user?.name ?? "Athlete";
  const userEmail = session.user?.email ?? undefined;
  const userId = session.user?.id ?? session.user?.email ?? "athlete";

  let runs = [] as ReturnType<typeof processActivities>;

  try {
    const activities = await fetchStravaActivities(
      session.accessToken,
      20,
      300
    );
    runs = processActivities(activities);
  } catch {
    // continue with empty runs
  }

  return (
    <AppShell userEmail={userEmail}>
      <UnitsGuard userId={userId}>
        <DashboardTopBar userName={userName} />
        <CoachPageContent userId={userId} runs={runs} />
      </UnitsGuard>
    </AppShell>
  );
}
