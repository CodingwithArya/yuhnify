"use client";

import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Home" },
  { href: "/coach", label: "Coach" },
  { href: "/music", label: "Music" },
  { href: "/routes", label: "Routes" },
  { href: "/profile", label: "Profile" },
] as const;

interface MobileNavProps {
  pathname: string;
}

export function MobileNav({ pathname }: MobileNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-[#18181b] border-t border-[#27272a] z-40">
      <ul className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center px-3 py-1 text-xs ${
                  isActive ? "text-[#f97316]" : "text-[#71717a]"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
