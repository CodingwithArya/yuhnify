"use client";

import { useState } from "react";
import { BugReportModal } from "./BugReportModal";

interface BugReportTriggerProps {
  defaultEmail?: string;
  className?: string;
  componentStack?: string;
}

export function BugReportTrigger({
  defaultEmail,
  className = "",
  componentStack,
}: BugReportTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          className ||
          "text-sm text-[#71717a] hover:text-white transition-colors text-left"
        }
      >
        Report a bug
      </button>
      <BugReportModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        defaultEmail={defaultEmail}
        componentStack={componentStack}
      />
    </>
  );
}
