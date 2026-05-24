"use client";

import { useState } from "react";
import type { PlanApproach } from "@/types";
import { truncateWords } from "@/lib/plan-utils";

interface ApproachModalProps {
  approach: PlanApproach;
  isOpen: boolean;
  onClose: () => void;
}

export function ApproachModal({ approach, isOpen, onClose }: ApproachModalProps) {
  const [showMore, setShowMore] = useState(false);

  if (!isOpen) return null;

  const firstSentence = approach.reasoning.match(/^[^.!?]+[.!?]/)?.[0]?.trim()
    ?? truncateWords(approach.reasoning, 20);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-sm bg-[#18181b] border border-[#27272a] rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm">{approach.name}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#71717a] text-sm"
          >
            Close
          </button>
        </div>

        <p className="text-xs text-[#71717a] leading-snug line-clamp-2">
          {firstSentence}
        </p>

        <div className="space-y-1.5">
          <a
            href={approach.primarySource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs text-[#f97316]"
          >
            {approach.primarySource.label}
          </a>
          <a
            href={approach.injurySource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs text-[#f97316]"
          >
            {approach.injurySource.label}
          </a>
        </div>

        {approach.additionalSources.length > 0 && (
          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            className="text-xs text-[#71717a]"
          >
            {showMore ? "Hide research" : "More research"}
          </button>
        )}

        {showMore && (
          <div className="space-y-1.5 pt-1">
            {approach.additionalSources.map((source) => (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-[#f97316]"
              >
                {source.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
