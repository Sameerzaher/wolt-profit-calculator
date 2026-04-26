export type PeakSlot = "morning" | "lunch" | "evening" | "night";
export type ZoneStrength = "strong" | "medium" | "weak";

export const deliveryZones = {
  haifa: ["חיפה מרכז", "הדר", "כרמל", "נווה שאנן", "מת״מ", "צ׳ק פוסט", "בת גלים", "מרכזית המפרץ"],
  krayot: ["BIG קריות", "קרית אתא", "קרית מוצקין", "קרית ביאליק", "קרית ים", "קרית חיים"],
  nearby: ["נשר", "טירת כרמל", "עכו"]
} as const;

export const zoneMeta: Record<string, { strength: ZoneStrength; peak: PeakSlot[] }> = {
  "מת״מ": { strength: "strong", peak: ["morning", "evening"] },
  "צ׳ק פוסט": { strength: "strong", peak: ["lunch", "evening"] },
  "חיפה מרכז": { strength: "strong", peak: ["evening"] },
  הדר: { strength: "medium", peak: ["lunch"] },
  כרמל: { strength: "medium", peak: ["evening"] },
  "נווה שאנן": { strength: "medium", peak: ["night"] },
  "בת גלים": { strength: "medium", peak: ["evening"] },
  "מרכזית המפרץ": { strength: "medium", peak: ["lunch", "evening"] },
  "BIG קריות": { strength: "strong", peak: ["lunch", "evening"] },
  "קרית אתא": { strength: "medium", peak: ["lunch"] },
  "קרית מוצקין": { strength: "medium", peak: ["evening"] },
  "קרית ביאליק": { strength: "medium", peak: ["evening"] },
  "קרית ים": { strength: "weak", peak: [] },
  "קרית חיים": { strength: "weak", peak: [] },
  נשר: { strength: "medium", peak: ["lunch"] },
  "טירת כרמל": { strength: "medium", peak: ["evening"] },
  עכו: { strength: "weak", peak: [] }
};

export type ZoneRegion = keyof typeof deliveryZones;
export const REGION_LABELS: Record<ZoneRegion | "other", string> = {
  haifa: "חיפה",
  krayot: "קריות",
  nearby: "אחר",
  other: "לא משויך"
};

export function getZonesByRegion(region: ZoneRegion): string[] {
  return [...deliveryZones[region]];
}

export function getZoneRegion(zone: string): ZoneRegion | "other" {
  if (deliveryZones.haifa.includes(zone as never)) return "haifa";
  if (deliveryZones.krayot.includes(zone as never)) return "krayot";
  if (deliveryZones.nearby.includes(zone as never)) return "nearby";
  return "other";
}

export function mapTimeOfDayToPeakSlot(timeOfDay: string): PeakSlot | null {
  const normalized = timeOfDay.trim().toLowerCase();
  if (normalized === "בוקר" || normalized === "morning") return "morning";
  if (normalized === "צהריים" || normalized === "lunch") return "lunch";
  if (normalized === "ערב" || normalized === "evening") return "evening";
  if (normalized === "לילה" || normalized === "night") return "night";
  return null;
}
