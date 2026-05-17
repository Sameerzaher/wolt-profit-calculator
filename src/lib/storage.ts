import { DAY_SHIFT_STORAGE_PREFIX, STORAGE_KEYS } from "@/lib/constants";
import {
  isDayShiftsMigrated,
  markDayShiftsMigrated,
  mergeDayRecords,
  migrateSnapshotToDayRecord
} from "@/src/lib/migrateDayShifts";
import type { DayShiftRecord } from "@/src/types/delivery-platform";
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
    dayShifts: listAllDayShifts(),
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
  safeWrite(getShiftAnalysisStorageKey(shiftDate), legacy);
  safeRemove(legacyKey);
  return legacy;
}

export function deleteShiftAnalysisByDate(shiftDate: string) {
  safeRemove(getShiftAnalysisStorageKey(shiftDate));
}

export function getDayShiftStorageKey(shiftDate: string): string {
  return `${DAY_SHIFT_STORAGE_PREFIX}${shiftDate}`;
}

export function readDayShiftByDate(shiftDate: string): DayShiftRecord | null {
  runDayShiftsMigrationIfNeeded();
  const fromIndex = readDayShiftsIndex().find((record) => record.shiftDate === shiftDate);
  if (fromIndex) return fromIndex;

  const legacy = safeRead<DayShiftRecord | null>(getDayShiftStorageKey(shiftDate), null);
  if (!legacy) return null;
  upsertDayShiftInIndex(legacy);
  return legacy;
}

export function saveDayShift(record: DayShiftRecord) {
  const next: DayShiftRecord = { ...record, updatedAt: new Date().toISOString(), schemaVersion: 1 };
  safeWrite(getDayShiftStorageKey(record.shiftDate), next);
  upsertDayShiftInIndex(next);
}

export function deleteDayShiftByDate(shiftDate: string) {
  safeRemove(getDayShiftStorageKey(shiftDate));
  const index = readDayShiftsIndex().filter((record) => record.shiftDate !== shiftDate);
  safeWrite(STORAGE_KEYS.dayShifts, index);
}

export function listAllDayShifts(): DayShiftRecord[] {
  runDayShiftsMigrationIfNeeded();
  return readDayShiftsIndex().sort((a, b) => b.shiftDate.localeCompare(a.shiftDate));
}

export function runDayShiftsMigrationIfNeeded(): void {
  if (typeof window === "undefined") return;
  if (isDayShiftsMigrated()) return;

  const existing = readDayShiftsIndex();
  const fromSnapshots = listAllShiftAnalyses().map(migrateSnapshotToDayRecord);
  const merged = mergeDayRecords(existing, fromSnapshots);

  safeWrite(STORAGE_KEYS.dayShifts, merged);
  for (const record of merged) {
    safeWrite(getDayShiftStorageKey(record.shiftDate), record);
  }
  markDayShiftsMigrated();
}

function readDayShiftsIndex(): DayShiftRecord[] {
  return safeRead<DayShiftRecord[]>(STORAGE_KEYS.dayShifts, []);
}

function upsertDayShiftInIndex(record: DayShiftRecord) {
  const index = readDayShiftsIndex();
  const next = index.filter((item) => item.shiftDate !== record.shiftDate);
  next.push(record);
  next.sort((a, b) => b.shiftDate.localeCompare(a.shiftDate));
  safeWrite(STORAGE_KEYS.dayShifts, next);
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
