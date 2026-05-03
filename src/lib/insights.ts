import type { DeliveryTask } from "@/types/models";

export function buildShiftInsights(
  tasks: DeliveryTask[],
  grossPerHour: number | undefined,
  grossPerRealKm: number | undefined
): string[] {
  const primary: string[] = [];
  const extra: string[] = [];

  if (grossPerHour !== undefined) {
    if (grossPerHour > 70) primary.push("משמרת חזקה");
    else if (grossPerHour < 45) primary.push("משמרת חלשה");
  }

  if (grossPerRealKm !== undefined) {
    if (grossPerRealKm > 4) primary.push("ק״מ יעיל");
    if (grossPerRealKm < 3) primary.push("נסעת יותר מדי");
  }

  const bestRestaurant = groupBest(tasks, (task) => task.restaurant);
  if (bestRestaurant) extra.push(`מסעדה חזקה: ${bestRestaurant}`);

  const bestTimeBlock = getBestTimeBlock(tasks);
  if (bestTimeBlock) extra.push(`זמן חזק: ${bestTimeBlock}`);

  const merged = [...new Set([...primary, ...extra])];
  while (merged.length < 3) merged.push("אין מספיק נתונים — מומלץ להוסיף עוד צילומים");
  return merged.slice(0, 5);
}

function groupBest(tasks: DeliveryTask[], keySelector: (task: DeliveryTask) => string | undefined): string | undefined {
  const revenueByKey = new Map<string, number>();
  for (const task of tasks) {
    const key = (keySelector(task) ?? "").trim();
    if (!key) continue;
    revenueByKey.set(key, (revenueByKey.get(key) ?? 0) + task.amountIls);
  }
  return [...revenueByKey.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

function getBestTimeBlock(tasks: DeliveryTask[]): string | undefined {
  const blocks = new Map<string, number>();
  for (const task of tasks) {
    if (!task.time) continue;
    const [hourStr] = task.time.split(":");
    const hour = Number(hourStr);
    if (!Number.isFinite(hour)) continue;
    const startHour = Math.floor(hour / 3) * 3;
    const label = `${pad2(startHour)}:00–${pad2((startHour + 3) % 24)}:00`;
    blocks.set(label, (blocks.get(label) ?? 0) + task.amountIls);
  }
  return [...blocks.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}
