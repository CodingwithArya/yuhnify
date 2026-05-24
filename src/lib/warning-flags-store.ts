function dismissedKey(userId: string, planId: string): string {
  return `yuhnify-warnings-dismissed-${userId}-${planId}`;
}

function listExpandedKey(userId: string, planId: string): string {
  return `yuhnify-warnings-expanded-${userId}-${planId}`;
}

export function warningFlagId(flag: string, index: number): string {
  return `${index}-${flag.slice(0, 40).replace(/\s+/g, "-")}`;
}

export function loadDismissedWarnings(
  userId: string,
  planId: string
): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(dismissedKey(userId, planId));
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function saveDismissedWarnings(
  userId: string,
  planId: string,
  ids: string[]
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(dismissedKey(userId, planId), JSON.stringify(ids));
  } catch {
    // ignore
  }
}

export function loadWarningsExpanded(
  userId: string,
  planId: string
): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(listExpandedKey(userId, planId)) === "true";
  } catch {
    return false;
  }
}

export function saveWarningsExpanded(
  userId: string,
  planId: string,
  expanded: boolean
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(listExpandedKey(userId, planId), String(expanded));
  } catch {
    // ignore
  }
}
