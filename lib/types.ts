export type NextOrderChance = "high" | "medium" | "low";

export type Verdict = "שווה מאוד" | "שווה" | "גבולי" | "לא שווה";

export type CalculatorInput = {
  payout: number;
  minutes: number;
  km: number;
  isPeakHour: boolean;
  inHotZone: boolean;
  nextOrderChance: NextOrderChance;
};

export type CalculationResult = {
  ilsPerMinute: number;
  ilsPerKm: number;
  netPayout: number;
  netIlsPerMinute: number;
  netIlsPerKm: number;
  score: number;
  verdict: Verdict;
  explanation: string;
  recommendation: string;
};

export type ScoringSettings = {
  costPerKm: number;
  peakBonus: number;
  outOfHotZonePenalty: number;
  lowChancePenalty: number;
  mediumChancePenalty: number;
  highChanceBonus: number;
};

export type SavedDelivery = CalculatorInput &
  CalculationResult & {
    id: string;
    createdAt: string;
  };

export type BackupPayload = {
  deliveries: SavedDelivery[];
  settings: ScoringSettings;
  exportedAt: string;
  /** Matches BACKUP_SCHEMA_VERSION in lib/constants */
  version: number;
};
