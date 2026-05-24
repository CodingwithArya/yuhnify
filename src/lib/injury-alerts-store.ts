import type { InjuryAlert } from "@/lib/injury-intelligence";

function storageKey(userId: string): string {
  return `yuhnify-dismissed-injury-alerts-${userId}`;
}

export function injuryAlertKey(alert: InjuryAlert): string {
  return `${alert.bodyPart}:${alert.condition}`;
}

export function loadDismissedInjuryAlerts(userId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function dismissInjuryAlert(userId: string, alertKey: string): void {
  if (typeof window === "undefined") return;
  try {
    const current = loadDismissedInjuryAlerts(userId);
    if (current.includes(alertKey)) return;
    localStorage.setItem(
      storageKey(userId),
      JSON.stringify([...current, alertKey])
    );
  } catch {
    // ignore
  }
}
