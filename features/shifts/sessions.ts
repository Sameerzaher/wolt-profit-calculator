import { round2 } from "@/lib/utils";
import type { ShiftSession } from "@/types/models";

type SessionRange = {
  id: string;
  start: number;
  end: number;
};

export function summarizeShiftSessions(sessions: ShiftSession[]) {
  const ranges = toSortedRanges(sessions);
  if (ranges.length === 0) {
    return {
      activeWorkHours: undefined,
      breakHours: undefined
    };
  }

  const activeMinutes = ranges.reduce((sum, range) => sum + (range.end - range.start), 0);
  let breakMinutes = 0;
  for (let i = 1; i < ranges.length; i += 1) {
    breakMinutes += Math.max(0, ranges[i].start - ranges[i - 1].end);
  }

  return {
    activeWorkHours: round2(activeMinutes / 60),
    breakHours: round2(breakMinutes / 60)
  };
}

export function validateShiftSessions(sessions: ShiftSession[]): string[] {
  const issues: string[] = [];
  const ranges = toSortedRanges(sessions);

  for (const session of sessions) {
    const start = toMinutes(session.startTime);
    const end = toMinutes(session.endTime);
    if (start === null || end === null) continue;
    if (start === end) {
      issues.push("שעת סיום לא יכולה להיות זהה לשעת התחלה");
      break;
    }
  }

  for (let i = 1; i < ranges.length; i += 1) {
    if (ranges[i].start < ranges[i - 1].end) {
      issues.push("אין אפשרות לחפיפה בין מקטעים");
      break;
    }
  }

  return issues;
}

function toSortedRanges(sessions: ShiftSession[]): SessionRange[] {
  return sessions
    .map((session) => {
      const start = toMinutes(session.startTime);
      const end = toMinutes(session.endTime);
      if (start === null || end === null) return null;
      const nextDay = session.isNextDay || session.endsNextDay || end < start;
      const normalizedEnd = nextDay ? end + 24 * 60 : end;
      return { id: session.id, start, end: normalizedEnd };
    })
    .filter((value): value is SessionRange => value !== null)
    .sort((a, b) => a.start - b.start);
}

function toMinutes(value: string): number | null {
  const match = value.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}
