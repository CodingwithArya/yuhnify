import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { DashboardTopBar } from "@/components/DashboardTopBar";
import { ProfileEditor } from "@/components/profile/ProfileEditor";
import Link from "next/link";
import { BugReportTrigger } from "@/components/BugReportTrigger";

export default async function ProfilePage() {
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
      <main className="px-4 py-5 md:px-6 space-y-5 max-w-lg">
        <ProfileEditor
          userId={userId}
          userEmail={userEmail}
          initialFirstName={userName.split(" ")[0] ?? userName}
        />

        <Link
          href="/settings"
          className="block w-full py-3 px-4 rounded-xl bg-[#18181b] border border-[#27272a] text-sm text-[#71717a] hover:text-white transition-colors text-left"
        >
          Settings
        </Link>

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
