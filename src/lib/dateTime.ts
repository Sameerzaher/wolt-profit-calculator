export function getTodayDateInput(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatHours(hours: number | undefined): string {
  if (hours === undefined) return "-";
  return `${hours.toFixed(2)}h`;
}
