import { getZoneRegion } from "@/data/zones";
import { dateKey, getTodayKey } from "@/lib/utils";
import type { Delivery } from "@/types/models";

export type HistoryFilter = "today" | "week" | "bad";

export function isBadOrder(delivery: Delivery): boolean {
  const net = delivery.finalNetProfit ?? delivery.quickCheckResult.estimatedNetProfit;
  return delivery.quickCheckResult.score < 60 || net < 15;
}

export function filterDeliveries(
  deliveries: Delivery[],
  filter: HistoryFilter,
  zoneFilter: string
): Delivery[] {
  const completed = deliveries.filter((delivery) => delivery.status === "completed");
  const today = getTodayKey();

  return completed.filter((delivery) => {
    const dayKey = dateKey(delivery.acceptedAt);
    const inDateScope =
      filter === "today"
        ? dayKey === today
        : filter === "week"
          ? new Date(delivery.acceptedAt).getTime() >= Date.now() - 7 * 24 * 60 * 60 * 1000
          : true;

    const zoneMatch =
      zoneFilter === "all" ||
      delivery.pickupZone === zoneFilter ||
      delivery.dropoffZone === zoneFilter ||
      getZoneRegion(delivery.dropoffZone) === zoneFilter;

    const badMatch = filter !== "bad" || isBadOrder(delivery);
    return inDateScope && zoneMatch && badMatch;
  });
}
