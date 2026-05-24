export interface StoredCheckIn {
  feeling: string;
  completed: string;
  notes?: string;
}

function storageKey(userId: string, planId: string, day: string): string {
  return `yuhnify-checkin-${userId}-${planId}-${day.toLowerCase()}`;
}

export function loadCheckIn(
  userId: string,
  planId: string,
  day: string
): StoredCheckIn | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(userId, planId, day));
    if (!raw) return null;
    return JSON.parse(raw) as StoredCheckIn;
  } catch {
    return null;
  }
}

export function saveCheckInLocal(
  userId: string,
  planId: string,
  day: string,
  data: StoredCheckIn
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(userId, planId, day), JSON.stringify(data));
  } catch {
    // ignore
  }
}
