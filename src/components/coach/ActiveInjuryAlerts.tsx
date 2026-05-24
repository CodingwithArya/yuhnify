"use client";

import { useEffect, useState } from "react";
import type { InjuryAlert } from "@/lib/injury-intelligence";
import {
  dismissInjuryAlert,
  injuryAlertKey,
  loadDismissedInjuryAlerts,
} from "@/lib/injury-alerts-store";

interface ActiveInjuryAlertsProps {
  userId: string;
  alerts: InjuryAlert[];
}

export function ActiveInjuryAlerts({ userId, alerts }: ActiveInjuryAlertsProps) {
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    setDismissed(loadDismissedInjuryAlerts(userId));
  }, [userId, alerts]);

  const visible = alerts.filter(
    (alert) => !dismissed.includes(injuryAlertKey(alert))
  );

  if (visible.length === 0) return null;

  function handleDismiss(alert: InjuryAlert) {
    const key = injuryAlertKey(alert);
    dismissInjuryAlert(userId, key);
    setDismissed((prev) => [...prev, key]);
  }

  return (
    <section className="mb-5 space-y-3">
      <h2 className="text-sm font-semibold text-white">Active alerts</h2>
      {visible.map((alert) => (
        <div
          key={injuryAlertKey(alert)}
          className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-2"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-amber-200">
                {alert.condition}
              </p>
              <p className="text-xs text-[#71717a] mt-0.5">
                {alert.bodyPart} · {alert.severity}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleDismiss(alert)}
              className="text-xs text-[#71717a] hover:text-white shrink-0"
            >
              Dismiss
            </button>
          </div>
          <p className="text-xs text-amber-100/90">{alert.immediateAction}</p>
          {alert.recommendations.length > 0 && (
            <ul className="text-xs text-[#a1a1aa] space-y-1 list-disc pl-4">
              {alert.recommendations.slice(0, 3).map((rec) => (
                <li key={rec.text}>{rec.text}</li>
              ))}
            </ul>
          )}
          <p className="text-xs text-red-300/90">{alert.redFlag}</p>
        </div>
      ))}
      <p className="text-xs text-[#71717a]">
        Training adjustments only, not medical advice. See a sports physio for
        persistent or worsening symptoms.
      </p>
    </section>
  );
}
