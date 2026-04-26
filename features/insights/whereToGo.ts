import { getZoneRegion, zoneMeta } from "@/data/zones";
import { round2 } from "@/lib/utils";
import type { Delivery } from "@/types/models";

export interface WhereToGoSuggestion {
  title: string;
  reason: string;
  zone: string;
}

function buildHourBucket(date: Date): string {
  const hour = date.getHours();
  const start = Math.floor(hour / 2) * 2;
  return `${String(start).padStart(2, "0")}:00-${String(start + 2).padStart(2, "0")}:00`;
}

export function getWhereToGoNow(deliveries: Delivery[]): WhereToGoSuggestion {
  const completed = deliveries.filter((delivery) => delivery.status === "completed");
  if (completed.length < 3) {
    return {
      title: "עכשיו עדיף חיפה מרכז",
      reason: "אין מספיק היסטוריה, מתחילים מאזור חזק עם ביקוש יציב.",
      zone: "חיפה מרכז"
    };
  }

  const currentBucket = buildHourBucket(new Date());
  const byZone = new Map<string, number[]>();
  const regionPerformance = { haifa: [] as number[], krayot: [] as number[] };

  completed.forEach((delivery) => {
    const net = delivery.finalNetProfit ?? delivery.quickCheckResult.estimatedNetProfit;
    const bucket = buildHourBucket(new Date(delivery.acceptedAt));
    if (bucket !== currentBucket) return;
    const values = byZone.get(delivery.dropoffZone) ?? [];
    values.push(net);
    byZone.set(delivery.dropoffZone, values);
    const region = getZoneRegion(delivery.dropoffZone);
    if (region === "haifa" || region === "krayot") {
      regionPerformance[region].push(net);
    }
  });

  const bestZone = [...byZone.entries()]
    .map(([zone, values]) => [zone, values.reduce((sum, value) => sum + value, 0) / values.length] as const)
    .sort((a, b) => b[1] - a[1])[0];

  if (!bestZone) {
    return {
      title: `עכשיו עדיף ${new Date().getHours() >= 20 ? "צ׳ק פוסט" : "חיפה מרכז"}`,
      reason: "אין מספיק מידע לשעה הזו, מומלץ להישאר באזורי חוזק קלאסיים.",
      zone: new Date().getHours() >= 20 ? "צ׳ק פוסט" : "חיפה מרכז"
    };
  }

  const zoneStrength = zoneMeta[bestZone[0]]?.strength ?? "medium";
  const haifaAvg =
    regionPerformance.haifa.length > 0
      ? regionPerformance.haifa.reduce((sum, value) => sum + value, 0) / regionPerformance.haifa.length
      : 0;
  const krayotAvg =
    regionPerformance.krayot.length > 0
      ? regionPerformance.krayot.reduce((sum, value) => sum + value, 0) / regionPerformance.krayot.length
      : 0;

  if (krayotAvg + 6 < haifaAvg) {
    return {
      title: "הקריות חלשות כרגע",
      reason: `רווח ממוצע נמוך בכ-${round2(haifaAvg - krayotAvg)} ₪ לעומת חיפה באותה שעה.`,
      zone: bestZone[0]
    };
  }

  return {
    title: `עכשיו עדיף ${bestZone[0]}`,
    reason: `האזור מציג ביצועים ${zoneStrength === "strong" ? "חזקים" : "טובים"} בשעה ${currentBucket}.`,
    zone: bestZone[0]
  };
}
