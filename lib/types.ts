export type DecisionKind = "strong_accept" | "accept" | "depends" | "reject";

export type CalculatorInput = {
  price: number;
  distanceKm: number;
  /** When null, NIS/hour is not computed and hourly rules stay neutral */
  estimatedMinutes: number | null;
  cashTip: number;
  isDoubleOrder: boolean;
  leavesHotZone: boolean;
};

export type OrderEvaluation = {
  nisPerKm: number;
  nisPerHour: number | null;
  /** 0–100 */
  score: number;
  decision: DecisionKind;
  /** Short combined line for quick scanning */
  reason: string;
  /** Bullet explanations for the UI */
  reasons: string[];
};

export type SavedDelivery = CalculatorInput &
  OrderEvaluation & {
    id: string;
    createdAt: string;
  };

/** v2 backup on disk */
export type BackupPayload = {
  deliveries: SavedDelivery[];
  exportedAt: string;
  version: 2;
};

export type DailySummaryPrefs = {
  hoursWorked: number;
  /** Full manual tip total when tipsInputMode is manual */
  cashTipsNis: number;
  /** Added on top of tips summed from saved checks today when tipsInputMode is from_history */
  extraCashTipsNis: number;
  tipsInputMode: "from_history" | "manual";
};
