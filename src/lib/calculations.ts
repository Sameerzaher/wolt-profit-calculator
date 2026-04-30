import { round2 } from "@/lib/utils";

export function calculateVehicleCost(actualKm: number | undefined, costPerKm: number): number | undefined {
  if (actualKm === undefined || !Number.isFinite(actualKm)) return undefined;
  return round2(Math.max(0, actualKm) * Math.max(0, costPerKm));
}

export function calculateNetIncome(grossIncome: number, vehicleCost: number | undefined): number | undefined {
  if (vehicleCost === undefined) return undefined;
  return round2(grossIncome - vehicleCost);
}

export function calculateRatePerHour(amount: number | undefined, hours: number | undefined): number | undefined {
  if (amount === undefined || hours === undefined || hours <= 0) return undefined;
  return round2(amount / hours);
}

export function calculateRatePerKm(amount: number | undefined, km: number | undefined): number | undefined {
  if (amount === undefined || km === undefined || km <= 0) return undefined;
  return round2(amount / km);
}
