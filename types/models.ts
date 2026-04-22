export type TrafficLevel = "low" | "medium" | "high";
export type DropoffDemandQuality = "good" | "medium" | "bad";
export type DeliveryRating = "good" | "ok" | "bad";
export type Decision = "accept" | "borderline" | "skip";
export type DeliveryStatus = "active" | "completed";
export type ZoneStrength = "strong" | "medium" | "weak";

export interface QuickCheckInput {
  offerAmount: number;
  estimatedKm: number;
  estimatedMinutes: number;
  pickupZone: string;
  dropoffZone: string;
  timeOfDay: string;
  weatherBonus: boolean;
  trafficLevel: TrafficLevel;
  hardParking: boolean;
}

export interface QuickCheckResult {
  score: number;
  decision: Decision;
  decisionLabel: "לקחת" | "גבולי" | "לדלג";
  estimatedIlsPerHour: number;
  estimatedNetProfit: number;
  explanation: string;
  isCrossRegion: boolean;
  isStrongDestination: boolean;
  isWeakDestination: boolean;
  isPeakTime: boolean;
  throwsOutOfHotZone: boolean;
}

export interface DeliveryCompletionInput {
  actualAmount: number;
  tipCash: number;
  actualKm: number;
  actualMinutes: number;
  restaurantDelay: boolean;
  dropoffDemandQuality: DropoffDemandQuality;
  deliveryRating: DeliveryRating;
  notes: string;
}

export interface Delivery extends QuickCheckInput {
  id: string;
  shiftId: string;
  status: DeliveryStatus;
  acceptedAt: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  quickCheckResult: QuickCheckResult;
  completion?: DeliveryCompletionInput;
  finalNetProfit?: number;
  finalIlsPerHour?: number;
  estimatedFuelCost?: number;
}

export interface Shift {
  id: string;
  dateKey: string;
  startedAt: string;
  endedAt?: string;
  deliveryIds: string[];
  idleTimeEstimateMinutes: number;
}

export interface ZoneStats {
  zone: string;
  deliveryCount: number;
  avgIncome: number;
  avgDuration: number;
  avgKm: number;
  avgScore: number;
  followUpDemandQuality: DropoffDemandQuality;
  strengthLabel: ZoneStrength;
}

export interface FuelSettings {
  vehicleName: string;
  kmPerLiter: number;
  fuelPricePerLiter: number;
  costPerKm: number;
}

export interface AppSettings {
  dailyTarget: number;
  onboardingDone: boolean;
  demoMode: boolean;
  activeDeliveryId: string | null;
}
