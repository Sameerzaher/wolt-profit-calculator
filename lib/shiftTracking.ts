import { round2 } from "@/lib/utils";
import type { AppShiftBreak } from "@/types/models";

export function calculateBreakMinutes(breaks: AppShiftBreak[], nowIso: string): number {
  return breaks.reduce((sum, item) => {
    const start = Date.parse(item.start);
    const end = Date.parse(item.end ?? nowIso);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return sum;
    return sum + (end - start) / 1000 / 60;
  }, 0);
}

export function calculateWorkingMinutes(startIso: string, endIso: string, breaks: AppShiftBreak[]): number {
  const start = Date.parse(startIso);
  const end = Date.parse(endIso);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  const totalMinutes = (end - start) / 1000 / 60;
  const breakMinutes = calculateBreakMinutes(breaks, endIso);
  return round2(Math.max(0, totalMinutes - breakMinutes));
}

export function calculateHourlyRateFromShift(totalIncome: number, workingMinutes: number): number {
  if (workingMinutes <= 0) return 0;
  return round2(totalIncome / (workingMinutes / 60));
}
