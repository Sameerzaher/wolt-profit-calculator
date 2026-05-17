export type DeliveryPlatform = "wolt" | "haat" | "tenbis";

export const DELIVERY_PLATFORMS: DeliveryPlatform[] = ["wolt", "haat", "tenbis"];

export const PLATFORM_LABELS: Record<DeliveryPlatform, string> = {
  wolt: "Wolt",
  haat: "HaAt",
  tenbis: "Ten Bis"
};

export const PLATFORM_COLORS: Record<DeliveryPlatform, string> = {
  wolt: "emerald",
  haat: "sky",
  tenbis: "amber"
};

/** One work block on a single platform for a calendar day */
export interface ShiftSegment {
  id: string;
  platform: DeliveryPlatform;
  startTime: string;
  endTime: string;
  endsNextDay?: boolean;
  incomeIls: number;
  kilometers: number;
  notes?: string;
}

export interface DayShiftRecord {
  shiftDate: string;
  segments: ShiftSegment[];
  costPerKm: number;
  createdAt: string;
  updatedAt: string;
  schemaVersion: 1;
}

export interface SegmentMetrics {
  segmentId: string;
  platform: DeliveryPlatform;
  durationHours: number;
  incomePerHour: number;
  incomePerKm: number;
  fuelCost: number;
  netProfit: number;
}

export interface DayTotals {
  totalIncome: number;
  totalHours: number;
  totalKilometers: number;
  totalFuelCost: number;
  totalNetProfit: number;
}

export interface PlatformDayStats {
  platform: DeliveryPlatform;
  segmentCount: number;
  income: number;
  hours: number;
  kilometers: number;
  fuelCost: number;
  netProfit: number;
  netProfitPerHour: number;
  incomePerKm: number;
}

export interface PlatformComparison {
  bestNetProfitPerHour: { platform: DeliveryPlatform; value: number } | null;
  bestIncomePerKm: { platform: DeliveryPlatform; value: number } | null;
  worstPlatformToday: DeliveryPlatform | null;
}

export interface DayShiftAnalysis {
  segments: SegmentMetrics[];
  totals: DayTotals;
  byPlatform: PlatformDayStats[];
  comparison: PlatformComparison;
}
