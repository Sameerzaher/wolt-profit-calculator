export type OrderDecision = "strong_accept" | "accept" | "depends" | "reject";

/** קלט לניתוח הזמנה */
export type OrderInput = {
  price: number;
  distanceKm: number;
  estimatedMinutes: number | null;
  cashTip: number;
  isDoubleOrder: boolean;
  leavesHotZone: boolean;
};

/** פלט מנוע הכללים (לפי המפרט) — שדה `reason` נגזר ב־analyzeOrder לאחסון */
export type OrderAnalysisResult = {
  nisPerKm: number;
  nisPerHour: number | null;
  score: number;
  decision: OrderDecision;
  reasons: string[];
};
