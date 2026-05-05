import { getTodayKey, round2 } from "@/lib/utils";
import { calculateFuelCost } from "@/lib/scoring";
import { calculateWorkingMinutes } from "@/lib/shiftTracking";
import type { AppShift, Delivery, FuelSettings } from "@/types/models";

export interface ActiveShiftSnapshot {
  startedAt: string | null;
  runningMinutes: number;
  incomeSoFar: number;
  deliveriesCount: number;
  estimatedFuelCost: number;
  netProfit: number;
  hourlyRate: number;
  targetRemaining: number;
  missingHoursToTarget: number;
  momentumLabel: string;
  momentumTone: "good" | "warning" | "neutral";
}

export function calculateActiveShiftSnapshot(
  deliveries: Delivery[],
  shifts: AppShift[],
  fuelSettings: FuelSettings,
  dailyTarget: number,
  activeShiftId: string | null
): ActiveShiftSnapshot {
  const today = getTodayKey();
  const activeShift = shifts.find((shift) => shift.id === activeShiftId) ?? shifts.find((shift) => shift.dateKey === today && !shift.endedAt);
  if (!activeShift) {
    return {
      startedAt: null,
      runningMinutes: 0,
      incomeSoFar: 0,
      deliveriesCount: 0,
      estimatedFuelCost: 0,
      netProfit: 0,
      hourlyRate: 0,
      targetRemaining: dailyTarget,
      missingHoursToTarget: 0,
      momentumLabel: "התחל משמרת כדי לראות מומנטום",
      momentumTone: "neutral"
    };
  }

  const shiftDeliveries = deliveries.filter((delivery) => delivery.shiftId === activeShift.id && delivery.status === "completed");
  const incomeSoFar = shiftDeliveries.reduce(
    (sum, delivery) => sum + (delivery.completion?.actualAmount ?? 0) + (delivery.completion?.tipCash ?? 0),
    0
  );
  const estimatedFuelCost = shiftDeliveries.reduce(
    (sum, delivery) => sum + calculateFuelCost(delivery.completion?.actualKm ?? delivery.estimatedKm, fuelSettings),
    0
  );
  const netProfit = incomeSoFar - estimatedFuelCost;
  const nowIso = new Date().toISOString();
  const runningMinutes = calculateWorkingMinutes(activeShift.startedAt, nowIso, activeShift.breaks ?? []);
  const runningHours = runningMinutes > 0 ? runningMinutes / 60 : 0;
  const hourlyRate = runningHours > 0 ? netProfit / runningHours : 0;
  const targetRemaining = Math.max(0, dailyTarget - incomeSoFar);
  const missingHoursToTarget = hourlyRate > 0 ? targetRemaining / hourlyRate : 0;

  const firstHalf = shiftDeliveries.filter(
    (delivery) =>
      new Date(delivery.acceptedAt).getTime() <
      new Date(activeShift.startedAt).getTime() + ((Date.now() - new Date(activeShift.startedAt).getTime()) / 2)
  );
  const secondHalf = shiftDeliveries.filter((delivery) => !firstHalf.includes(delivery));
  const firstHalfRate =
    firstHalf.length > 0
      ? firstHalf.reduce((sum, delivery) => sum + (delivery.finalIlsPerHour ?? delivery.quickCheckResult.estimatedIlsPerHour), 0) /
        firstHalf.length
      : hourlyRate;
  const secondHalfRate =
    secondHalf.length > 0
      ? secondHalf.reduce((sum, delivery) => sum + (delivery.finalIlsPerHour ?? delivery.quickCheckResult.estimatedIlsPerHour), 0) /
        secondHalf.length
      : hourlyRate;
  const rising = secondHalfRate > firstHalfRate + 3;
  const dropping = secondHalfRate + 3 < firstHalfRate;

  return {
    startedAt: activeShift.startedAt,
    runningMinutes: round2(runningMinutes),
    incomeSoFar: round2(incomeSoFar),
    deliveriesCount: shiftDeliveries.length,
    estimatedFuelCost: round2(estimatedFuelCost),
    netProfit: round2(netProfit),
    hourlyRate: round2(hourlyRate),
    targetRemaining: round2(targetRemaining),
    missingHoursToTarget: round2(missingHoursToTarget),
    momentumLabel: rising ? "היום חזק, תמשיך" : dropping ? "הקצב יורד" : "קצב יציב",
    momentumTone: rising ? "good" : dropping ? "warning" : "neutral"
  };
}
