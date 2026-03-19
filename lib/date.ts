import { TIME_ZONE_IL } from "./constants";

const partsFormatter = new Intl.DateTimeFormat("he-IL", {
  timeZone: TIME_ZONE_IL,
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit"
});

function dateKeyInIsrael(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE_IL,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(d);
}

export function formatDateTime(dateIso: string): string {
  try {
    const date = new Date(dateIso);
    if (Number.isNaN(date.getTime())) return "—";
    return partsFormatter.format(date);
  } catch {
    return "—";
  }
}

/** "Today" by Israel calendar (Asia/Jerusalem) — avoids UTC midnight bugs */
export function isToday(dateIso: string): boolean {
  try {
    const target = new Date(dateIso);
    if (Number.isNaN(target.getTime())) return false;
    return dateKeyInIsrael(target) === dateKeyInIsrael(new Date());
  } catch {
    return false;
  }
}
