import { STORAGE_KEYS } from "@/lib/constants";

export function exportAllFromStorage() {
  return {
    deliveries: safeRead(STORAGE_KEYS.deliveries, []),
    shifts: safeRead(STORAGE_KEYS.shifts, []),
    preferredZones: safeRead(STORAGE_KEYS.preferredZones, []),
    appSettings: safeRead(STORAGE_KEYS.appSettings, null),
    fuelSettings: safeRead(STORAGE_KEYS.fuelSettings, null),
    exportedAt: new Date().toISOString()
  };
}

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
