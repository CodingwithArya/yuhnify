import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { DashboardTopBar } from "@/components/DashboardTopBar";
import { SettingsContent } from "@/components/settings/SettingsContent";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.accessToken) {
    redirect("/");
  }

  const userName = session.user?.name ?? "Athlete";
  const userEmail = session.user?.email ?? undefined;
  const userId = session.user?.id ?? session.user?.email ?? "athlete";

  return (
    <AppShell userEmail={userEmail}>
      <DashboardTopBar userName={userName} />
      <Suspense fallback={null}>
        <SettingsContent
          userId={userId}
          userName={userName}
          userEmail={userEmail}
        />
      </Suspense>
    </AppShell>
  );
}
