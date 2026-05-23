import Link from "next/link";

export function CoachNudgeCard() {
  return (
    <div className="bg-[#f97316]/10 border border-[#f97316]/30 rounded-xl p-4 flex items-center justify-between gap-4">
      <p className="text-white font-medium text-sm">
        Your training plan is ready
      </p>
      <Link
        href="/coach"
        className="shrink-0 px-4 py-2 rounded-lg bg-[#f97316] text-white text-sm font-medium hover:bg-orange-400 transition-colors"
      >
        Generate plan
      </Link>
    </div>
  );
}
