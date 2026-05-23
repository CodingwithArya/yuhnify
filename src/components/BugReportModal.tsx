"use client";

import { useEffect, useState } from "react";

const recentErrors: string[] = [];

function captureError(message: string) {
  recentErrors.push(message);
  if (recentErrors.length > 3) {
    recentErrors.shift();
  }
}

export function getRecentErrors(): string[] {
  return [...recentErrors];
}

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
  componentStack?: string;
}

export function BugReportModal({
  isOpen,
  onClose,
  defaultEmail = "",
  componentStack,
}: BugReportModalProps) {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState(defaultEmail);
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setEmail(defaultEmail);
  }, [defaultEmail]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOnError = window.onerror;
    window.onerror = (msg, _source, _line, _col, error) => {
      captureError(String(error?.message ?? msg));
      if (previousOnError) {
        return previousOnError(msg, _source, _line, _col, error);
      }
      return false;
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason =
        event.reason instanceof Error
          ? event.reason.message
          : String(event.reason);
      captureError(reason);
    };
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.onerror = previousOnError;
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) {
      setErrorMessage("Please describe what went wrong.");
      return;
    }
    if (trimmed.length > 500) {
      setErrorMessage("Message must be 500 characters or less.");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          email: email.trim() || undefined,
          url: window.location.href,
          userAgent: navigator.userAgent,
          screenSize: `${window.innerWidth}x${window.innerHeight}`,
          isMobile: window.innerWidth < 768,
          timestamp: new Date().toISOString(),
          recentErrors: getRecentErrors(),
          componentStack: componentStack ?? undefined,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to submit report");
      }

      setStatus("success");
      setMessage("");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong"
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/60">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bug-report-title"
        className="w-full max-w-md bg-[#18181b] border border-[#27272a] rounded-xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 id="bug-report-title" className="text-white font-semibold text-lg">
            Report a bug
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#71717a] hover:text-white text-sm"
          >
            Close
          </button>
        </div>

        {status === "success" ? (
          <p className="text-[#71717a] text-sm">
            Thanks for the report. We will look into it.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="bug-message"
                className="block text-sm text-[#71717a] mb-1.5"
              >
                What went wrong?
              </label>
              <textarea
                id="bug-message"
                required
                maxLength={500}
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-[#f97316]"
                placeholder="Describe the issue..."
              />
              <p className="text-xs text-[#71717a] mt-1 text-right">
                {message.length}/500
              </p>
            </div>

            <div>
              <label
                htmlFor="bug-email"
                className="block text-sm text-[#71717a] mb-1.5"
              >
                Email (optional)
              </label>
              <input
                id="bug-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f97316]"
                placeholder="you@example.com"
              />
            </div>

            {errorMessage && (
              <p className="text-sm text-red-400">{errorMessage}</p>
            )}

            <button
              type="submit"
              disabled={status === "submitting"}
              className="w-full py-2.5 rounded-lg bg-[#f97316] text-white font-medium text-sm hover:bg-orange-400 transition-colors disabled:opacity-50"
            >
              {status === "submitting" ? "Sending..." : "Submit report"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
