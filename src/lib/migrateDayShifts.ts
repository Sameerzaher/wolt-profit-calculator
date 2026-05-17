import type { DayShiftRecord, ShiftSegment } from "@/src/types/delivery-platform";
import type { AppShift, AppShiftSession, ScreenshotAnalysisSnapshot, ShiftSession } from "@/types/models";

const MIGRATION_FLAG_KEY = "woltcalc_v2_day_shifts_migrated";

export function isDayShiftsMigrated(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(MIGRATION_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

export function markDayShiftsMigrated(): void {
  try {
    localStorage.setItem(MIGRATION_FLAG_KEY, "1");
  } catch {
    // ignore
  }
}

export function migrateSnapshotToDayRecord(snapshot: ScreenshotAnalysisSnapshot): DayShiftRecord {
  const segment = snapshotToWoltSegment(snapshot);
  return {
    shiftDate: snapshot.shiftDate,
    segments: segment ? [segment] : [],
    costPerKm: snapshot.costPerKm,
    createdAt: snapshot.createdAt,
    updatedAt: snapshot.updatedAt,
    schemaVersion: 1
  };
}

/** Merge Wolt OCR data into an existing day without removing other platforms' segments. */
export function mergeSnapshotIntoDayRecord(
  existing: DayShiftRecord | null,
  snapshot: ScreenshotAnalysisSnapshot
): DayShiftRecord {
  const woltFromOcr = migrateSnapshotToDayRecord(snapshot);
  if (!existing) return woltFromOcr;

  const nonWolt = existing.segments.filter((segment) => segment.platform !== "wolt");
  return {
    ...existing,
    segments: [...nonWolt, ...woltFromOcr.segments],
    costPerKm: snapshot.costPerKm,
    updatedAt: new Date().toISOString()
  };
}

export function migrateAppShiftToSegments(shift: AppShift): ShiftSegment[] {
  const sessions = shift.sessions ?? [];
  if (sessions.length === 0) return [];

  const income = shift.totalIncome ?? 0;
  const km = shift.actualDrivenKm ?? shift.totalKm ?? 0;

  if (sessions.length === 1) {
    const session = sessions[0];
    return [
      {
        id: crypto.randomUUID(),
        platform: "wolt",
        startTime: session.startTime,
        endTime: session.endTime,
        endsNextDay: session.isNextDay || session.endsNextDay,
        incomeIls: income,
        kilometers: km,
        notes: "הועבר ממשמרת פעילה (Wolt)"
      }
    ];
  }

  const perSessionIncome = sessions.length > 0 ? income / sessions.length : 0;
  const perSessionKm = sessions.length > 0 ? km / sessions.length : 0;

  return sessions.map((session) => ({
    id: crypto.randomUUID(),
    platform: "wolt" as const,
    startTime: session.startTime,
    endTime: session.endTime,
    endsNextDay: session.isNextDay || session.endsNextDay,
    incomeIls: roundIncome(perSessionIncome),
    kilometers: roundKm(perSessionKm),
    notes: "הועבר ממשמרת פעילה (Wolt)"
  }));
}

export function mergeDayRecords(existing: DayShiftRecord[], incoming: DayShiftRecord[]): DayShiftRecord[] {
  const map = new Map<string, DayShiftRecord>();
  for (const record of existing) {
    map.set(record.shiftDate, record);
  }
  for (const record of incoming) {
    const prev = map.get(record.shiftDate);
    if (!prev) {
      map.set(record.shiftDate, record);
      continue;
    }
    if (record.segments.length >= prev.segments.length) {
      map.set(record.shiftDate, {
        ...record,
        createdAt: prev.createdAt,
        updatedAt: new Date().toISOString()
      });
    }
  }
  return [...map.values()].sort((a, b) => b.shiftDate.localeCompare(a.shiftDate));
}

function snapshotToWoltSegment(snapshot: ScreenshotAnalysisSnapshot): ShiftSegment | null {
  const income = snapshot.analysis?.grossIncome ?? 0;
  const km = snapshot.actualDrivenKm ?? snapshot.analysis?.offerDistanceKm ?? 0;
  const timeRange = resolveTimeRange(snapshot.shiftDate, snapshot.sessions);

  if (income <= 0 && km <= 0 && !timeRange) return null;

  return {
    id: crypto.randomUUID(),
    platform: "wolt",
    startTime: timeRange?.startTime ?? "09:00",
    endTime: timeRange?.endTime ?? "17:00",
    endsNextDay: timeRange?.endsNextDay ?? false,
    incomeIls: income,
    kilometers: km,
    notes: "הועבר מניתוח צילומי מסך (Wolt)"
  };
}

function resolveTimeRange(
  shiftDate: string,
  sessions: ShiftSession[]
): { startTime: string; endTime: string; endsNextDay: boolean } | null {
  if (sessions.length === 0) return null;

  const parsed = sessions
    .map((session) => sessionBounds(shiftDate, session))
    .filter((value): value is { start: Date; end: Date; endsNextDay: boolean } => value !== null);

  if (parsed.length === 0) return null;

  const start = parsed.reduce((min, row) => (row.start < min ? row.start : min), parsed[0].start);
  const end = parsed.reduce((max, row) => (row.end > max ? row.end : max), parsed[0].end);
  const endsNextDay = end.getDate() !== start.getDate();

  return {
    startTime: `${pad2(start.getHours())}:${pad2(start.getMinutes())}`,
    endTime: `${pad2(end.getHours())}:${pad2(end.getMinutes())}`,
    endsNextDay
  };
}

function sessionBounds(shiftDate: string, session: ShiftSession): { start: Date; end: Date; endsNextDay: boolean } | null {
  const start = parseSessionDateTime(session.startDateTime, shiftDate);
  const endRaw = parseSessionDateTime(session.endDateTime, shiftDate);
  if (!start || !endRaw) return null;

  const end = new Date(endRaw);
  if (session.isOvernight || end.getTime() <= start.getTime()) {
    end.setDate(end.getDate() + 1);
  }

  return { start, end, endsNextDay: end.getDate() !== start.getDate() };
}

function parseSessionDateTime(value: string, shiftDate: string): Date | null {
  if (!value) return null;
  if (/^\d{1,2}:\d{2}$/.test(value)) {
    return new Date(`${shiftDate}T${value}:00`);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function roundIncome(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundKm(value: number): number {
  return Math.round(value * 10) / 10;
}

function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}

export function appSessionToSegment(session: AppShiftSession, income: number, km: number): ShiftSegment {
  return {
    id: crypto.randomUUID(),
    platform: "wolt",
    startTime: session.startTime,
    endTime: session.endTime,
    endsNextDay: session.isNextDay || session.endsNextDay,
    incomeIls: income,
    kilometers: km,
    notes: ""
  };
}
