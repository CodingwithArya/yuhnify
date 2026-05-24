"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isOnboardingComplete,
  syncUnitsFromProfile,
} from "@/lib/user-profile-storage";
import {
  readUnitsFromStorage,
  type Units,
  writeUnitsToStorage,
} from "@/lib/units";

export function UnitsGuard({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId: string;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isOnboardingComplete(userId)) {
      router.replace("/settings?onboarding=true");
      return;
    }
    syncUnitsFromProfile(userId);
    setReady(true);
  }, [router, userId]);

  if (!ready) return null;
  return <>{children}</>;
}

export function useUnits() {
  const [units, setUnits] = useState<Units>("mi");

  useEffect(() => {
    setUnits(readUnitsFromStorage());
  }, []);

  function updateUnits(next: Units) {
    writeUnitsToStorage(next);
    setUnits(next);
  }

  return { units, setUnits: updateUnits };
}
