export interface CheckIn {
  id: string;
  day: string;
  runType: string;
  distanceKm: number;
  feeling: string;
  completed: string;
  notes?: string;
  planWeek: string;
  createdAt: string;
}

const checkinsMap = new Map<string, CheckIn[]>();

export function getCheckIns(userId: string): CheckIn[] {
  return checkinsMap.get(userId) ?? [];
}

export function addCheckIn(userId: string, checkin: CheckIn): CheckIn[] {
  const existing = getCheckIns(userId);
  const updated = [...existing, checkin];
  checkinsMap.set(userId, updated);
  return updated;
}

export function getCheckInCount(userId: string): number {
  return getCheckIns(userId).length;
}
