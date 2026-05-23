import Link from "next/link";
import { SignOutButton } from "./SignOutButton";

interface DashboardTopBarProps {
  userName: string;
}

export function DashboardTopBar({ userName }: DashboardTopBarProps) {
  return (
    <header className="flex items-center justify-between px-4 py-4 md:px-6 border-b border-[#27272a]">
      <Link href="/dashboard" className="text-xl font-bold text-white">
        yuhnify<span className="text-[#f97316]">.</span>
      </Link>
      <div className="flex items-center gap-4">
        <span className="text-sm text-[#71717a]">{userName}</span>
        <SignOutButton />
      </div>
    </header>
  );
}
