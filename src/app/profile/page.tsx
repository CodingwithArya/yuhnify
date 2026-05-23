import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { DashboardTopBar } from "@/components/DashboardTopBar";
import { BugReportTrigger } from "@/components/BugReportTrigger";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.accessToken) {
    redirect("/");
  }

  const userName = session.user?.name ?? "Athlete";
  const userEmail = session.user?.email ?? undefined;

  return (
    <AppShell userEmail={userEmail}>
      <DashboardTopBar userName={userName} />
      <main className="px-4 py-5 md:px-6 space-y-5 max-w-3xl">
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 space-y-3">
          <h1 className="text-white font-semibold text-lg">Profile</h1>
          <p className="text-sm text-[#71717a]">{userName}</p>
          {userEmail && (
            <p className="text-sm text-[#71717a]">{userEmail}</p>
          )}
        </div>

        <div className="md:hidden">
          <BugReportTrigger
            defaultEmail={userEmail}
            className="w-full py-3 px-4 rounded-xl bg-[#18181b] border border-[#27272a] text-sm text-[#71717a] hover:text-white transition-colors text-left"
          />
        </div>
      </main>
    </AppShell>
  );
}
