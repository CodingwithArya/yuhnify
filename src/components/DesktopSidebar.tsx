"use client";

import Link from "next/link";
import { BugReportTrigger } from "./BugReportTrigger";

const navItems = [
  { href: "/dashboard", label: "Home" },
  { href: "/coach", label: "Coach" },
  { href: "/music", label: "Music" },
  { href: "/routes", label: "Routes" },
  { href: "/profile", label: "Profile" },
] as const;

interface DesktopSidebarProps {
  pathname: string;
  userEmail?: string;
}

export function DesktopSidebar({ pathname, userEmail }: DesktopSidebarProps) {
  return (
    <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 bg-[#18181b] border-r border-[#27272a] z-40">
      <div className="px-6 py-5 border-b border-[#27272a]">
        <Link href="/dashboard" className="text-xl font-bold text-white">
          yuhnify<span className="text-[#f97316]">.</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-[#27272a] text-[#f97316]"
                  : "text-[#71717a] hover:text-white hover:bg-[#27272a]/50"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-4 border-t border-[#27272a]">
        <BugReportTrigger defaultEmail={userEmail} />
      </div>
    </aside>
  );
}
