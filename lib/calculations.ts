import { round2 } from "@/lib/utils";

function normalize(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, value);
}

export function calculateCost(distanceKm: number, costPerKm: number): number {
  return round2(normalize(distanceKm) * normalize(costPerKm));
}

export function calculateProfit(revenue: number, cost: number): number {
  return round2(revenue - normalize(cost));
}

export function calculateHourlyRate(amount: number, hours: number): number {
  if (!Number.isFinite(amount) || !Number.isFinite(hours) || hours <= 0) return 0;
  return round2(amount / hours);
}

export function calculatePerKm(amount: number, km: number): number {
  if (!Number.isFinite(amount) || !Number.isFinite(km) || km <= 0) return 0;
  return round2(amount / km);
}

// Backward-compatible aliases used across existing screens.
export function calculateVehicleCost(actualKm: number | undefined, costPerKm: number): number | undefined {
  if (actualKm === undefined || !Number.isFinite(actualKm)) return undefined;
  return calculateCost(actualKm, costPerKm);
}

export function calculateNetIncome(grossIncome: number, vehicleCost: number | undefined): number | undefined {
  if (vehicleCost === undefined) return undefined;
  return calculateProfit(grossIncome, vehicleCost);
}

export function calculateRatePerHour(amount: number | undefined, hours: number | undefined): number | undefined {
  if (amount === undefined || hours === undefined || hours <= 0) return undefined;
  return calculateHourlyRate(amount, hours);
}

export function calculateRatePerKm(amount: number | undefined, km: number | undefined): number | undefined {
  if (amount === undefined || km === undefined || km <= 0) return undefined;
  return calculatePerKm(amount, km);
}
