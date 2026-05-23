"use client";

import { usePathname } from "next/navigation";
import { DesktopSidebar } from "./DesktopSidebar";
import { MobileNav } from "./MobileNav";

interface AppShellProps {
  children: React.ReactNode;
  userEmail?: string;
}

export function AppShell({ children, userEmail }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#09090b]">
      <DesktopSidebar pathname={pathname} userEmail={userEmail} />
      <div className="md:pl-64 pb-16 md:pb-0">{children}</div>
      <MobileNav pathname={pathname} />
    </div>
  );
}
