import { STORAGE_KEYS } from "@/lib/constants";
import type { ScreenshotAnalysisSnapshot } from "@/types/models";
const SHIFT_PREFIX = "woltcalc_shift_";
const LEGACY_SHIFT_ANALYSIS_PREFIX = "woltcalc_shift_analysis_";

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

export function saveLastScreenshotAnalysis(snapshot: ScreenshotAnalysisSnapshot) {
  safeWrite(STORAGE_KEYS.screenshotLastAnalysis, snapshot);
}

export function readLastScreenshotAnalysis(): ScreenshotAnalysisSnapshot | null {
  return safeRead<ScreenshotAnalysisSnapshot | null>(STORAGE_KEYS.screenshotLastAnalysis, null);
}

export function getShiftAnalysisStorageKey(shiftDate: string): string {
  return `${SHIFT_PREFIX}${shiftDate}`;
}

export function saveShiftAnalysisByDate(snapshot: ScreenshotAnalysisSnapshot) {
  safeWrite(getShiftAnalysisStorageKey(snapshot.shiftDate), snapshot);
  saveLastScreenshotAnalysis(snapshot);
}

export function readShiftAnalysisByDate(shiftDate: string): ScreenshotAnalysisSnapshot | null {
  const current = safeRead<ScreenshotAnalysisSnapshot | null>(getShiftAnalysisStorageKey(shiftDate), null);
  if (current) return current;
  const legacyKey = `${LEGACY_SHIFT_ANALYSIS_PREFIX}${shiftDate}`;
  const legacy = safeRead<ScreenshotAnalysisSnapshot | null>(legacyKey, null);
  if (!legacy) return null;
  // Migrate old key to new key format lazily on first read.
  safeWrite(getShiftAnalysisStorageKey(shiftDate), legacy);
  safeRemove(legacyKey);
  return legacy;
}

export function deleteShiftAnalysisByDate(shiftDate: string) {
  safeRemove(getShiftAnalysisStorageKey(shiftDate));
}

export function listAllShiftAnalyses(): ScreenshotAnalysisSnapshot[] {
  if (typeof window === "undefined") return [];
  const items: ScreenshotAnalysisSnapshot[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;
    const isCurrent = key.startsWith(SHIFT_PREFIX);
    const isLegacy = key.startsWith(LEGACY_SHIFT_ANALYSIS_PREFIX);
    if (!isCurrent && !isLegacy) continue;
    const item = safeRead<ScreenshotAnalysisSnapshot | null>(key, null);
    if (!item) continue;
    if (isLegacy) {
      // Keep one canonical key after migration.
      const nextKey = getShiftAnalysisStorageKey(item.shiftDate);
      safeWrite(nextKey, item);
      safeRemove(key);
    }
    items.push(item);
  }
  return items.sort((a, b) => b.shiftDate.localeCompare(a.shiftDate));
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

function safeWrite<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore localStorage write failures in private mode/quota exceeded.
  }
}

function safeRemove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore localStorage remove failures.
  }
}
