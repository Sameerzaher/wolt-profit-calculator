export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatIls(value: number): string {
  return `₪${value.toFixed(1)}`;
}

export function dateKey(isoDate: string): string {
  return isoDate.slice(0, 10);
}

export function getTodayKey(): string {
  return dateKey(new Date().toISOString());
}

export function durationBetweenMinutes(startIso: string, endIso: string): number {
  const diff = new Date(endIso).getTime() - new Date(startIso).getTime();
  return Math.max(0, diff / 1000 / 60);
}
