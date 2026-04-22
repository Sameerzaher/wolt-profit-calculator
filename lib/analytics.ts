import { calculateFuelCost } from "@/lib/scoring";
import { dateKey, durationBetweenMinutes, getTodayKey, round2 } from "@/lib/utils";
import { getZoneRegion } from "@/src/data/zones";
import type { Delivery, DropoffDemandQuality, FuelSettings, Shift, ZoneStats, ZoneStrength } from "@/types/models";

export interface DashboardStats {
  todayIncome: number;
  netEstimatedProfit: number;
  totalDeliveries: number;
  netWorkHours: number;
  ilsPerHour: number;
  estimatedFuelCost: number;
  dailyTargetProgress: number;
}

export interface WeeklyInsights {
  bestDay: string;
  bestHourRange: string;
  bestZone: string;
  bestPickupZone: string;
  bestDropoffZone: string;
  bestTimeHaifa: string;
  bestTimeKrayot: string;
  averageIlsPerHour: number;
  averageMinutesPerDelivery: number;
  avgScoreHaifa: number;
  avgScoreKrayot: number;
  lowProfitDeliveries: number;
  recommendationSummary: string;
  daySeries: Array<{ day: string; profit: number }>;
}

export function getCompletedDeliveries(deliveries: Delivery[]): Delivery[] {
  return deliveries.filter((d) => d.status === "completed" && !!d.completion);
}

export function calculateDashboardStats(
  deliveries: Delivery[],
  shifts: Shift[],
  fuelSettings: FuelSettings,
  dailyTarget: number
): DashboardStats {
  const today = getTodayKey();
  const completedToday = getCompletedDeliveries(deliveries).filter((d) => dateKey(d.acceptedAt) === today);
  const todayShifts = shifts.filter((s) => s.dateKey === today);

  const todayIncome = completedToday.reduce((sum, d) => sum + (d.completion?.actualAmount ?? 0) + (d.completion?.tipCash ?? 0), 0);
  const estimatedFuelCost = completedToday.reduce(
    (sum, d) => sum + calculateFuelCost(d.completion?.actualKm ?? d.estimatedKm, fuelSettings),
    0
  );
  const netEstimatedProfit = todayIncome - estimatedFuelCost;
  const netWorkMinutes = todayShifts.reduce((sum, s) => {
    const shiftEnd = s.endedAt ?? new Date().toISOString();
    return sum + Math.max(0, durationBetweenMinutes(s.startedAt, shiftEnd) - s.idleTimeEstimateMinutes);
  }, 0);
  const netWorkHours = netWorkMinutes / 60;
  const ilsPerHour = netWorkHours > 0 ? netEstimatedProfit / netWorkHours : 0;
  const dailyTargetProgress = dailyTarget > 0 ? (todayIncome / dailyTarget) * 100 : 0;

  return {
    todayIncome: round2(todayIncome),
    netEstimatedProfit: round2(netEstimatedProfit),
    totalDeliveries: completedToday.length,
    netWorkHours: round2(netWorkHours),
    ilsPerHour: round2(ilsPerHour),
    estimatedFuelCost: round2(estimatedFuelCost),
    dailyTargetProgress: round2(Math.min(100, dailyTargetProgress))
  };
}

export function calculateShiftStats(deliveries: Delivery[], fuelSettings: FuelSettings, shift?: Shift) {
  const shiftDeliveries = shift
    ? getCompletedDeliveries(deliveries).filter((d) => d.shiftId === shift.id)
    : getCompletedDeliveries(deliveries);
  const grossIncome = shiftDeliveries.reduce((sum, d) => sum + (d.completion?.actualAmount ?? 0), 0);
  const tips = shiftDeliveries.reduce((sum, d) => sum + (d.completion?.tipCash ?? 0), 0);
  const estimatedFuelCost = shiftDeliveries.reduce(
    (sum, d) => sum + calculateFuelCost(d.completion?.actualKm ?? d.estimatedKm, fuelSettings),
    0
  );
  const totalMinutes = shiftDeliveries.reduce((sum, d) => sum + (d.completion?.actualMinutes ?? d.estimatedMinutes), 0);
  const totalKm = shiftDeliveries.reduce((sum, d) => sum + (d.completion?.actualKm ?? d.estimatedKm), 0);
  const netProfit = grossIncome + tips - estimatedFuelCost;
  const totalHours = totalMinutes / 60;

  return {
    grossIncome: round2(grossIncome),
    tips: round2(tips),
    estimatedFuelCost: round2(estimatedFuelCost),
    netProfit: round2(netProfit),
    totalDeliveries: shiftDeliveries.length,
    totalTime: round2(totalHours),
    idleTimeEstimate: shift?.idleTimeEstimateMinutes ?? 0,
    ilsPerHour: round2(totalHours > 0 ? netProfit / totalHours : 0),
    ilsPerKm: round2(totalKm > 0 ? netProfit / totalKm : 0)
  };
}

export function calculateWeeklyInsights(deliveries: Delivery[]): WeeklyInsights {
  const completed = getCompletedDeliveries(deliveries);
  if (completed.length === 0) {
    return {
      bestDay: "-",
      bestHourRange: "-",
      bestZone: "-",
      bestPickupZone: "-",
      bestDropoffZone: "-",
      bestTimeHaifa: "-",
      bestTimeKrayot: "-",
      averageIlsPerHour: 0,
      averageMinutesPerDelivery: 0,
      avgScoreHaifa: 0,
      avgScoreKrayot: 0,
      lowProfitDeliveries: 0,
      recommendationSummary: "אין מספיק נתונים עדיין. התחילו לשמור משלוחים.",
      daySeries: []
    };
  }

  const dayMap = new Map<string, number>();
  const hourBucketMap = new Map<string, number>();
  const zoneMap = new Map<string, number[]>();
  const pickupZoneMap = new Map<string, number[]>();
  const dropoffZoneMap = new Map<string, number[]>();
  const haifaHourMap = new Map<string, number>();
  const krayotHourMap = new Map<string, number>();
  const areaScores = {
    haifa: [] as number[],
    krayot: [] as number[]
  };

  let totalNet = 0;
  let totalMinutes = 0;
  let lowProfitDeliveries = 0;

  completed.forEach((delivery) => {
    const net = delivery.finalNetProfit ?? delivery.quickCheckResult.estimatedNetProfit;
    totalNet += net;
    totalMinutes += delivery.completion?.actualMinutes ?? delivery.estimatedMinutes;
    if (net < 15) lowProfitDeliveries += 1;

    const dKey = new Date(delivery.acceptedAt).toLocaleDateString("he-IL", { weekday: "short" });
    dayMap.set(dKey, (dayMap.get(dKey) ?? 0) + net);

    const hour = new Date(delivery.acceptedAt).getHours();
    const bucketStart = Math.floor(hour / 2) * 2;
    const bucket = `${String(bucketStart).padStart(2, "0")}:00-${String(bucketStart + 2).padStart(2, "0")}:00`;
    hourBucketMap.set(bucket, (hourBucketMap.get(bucket) ?? 0) + net);

    const zoneNets = zoneMap.get(delivery.dropoffZone) ?? [];
    zoneNets.push(net);
    zoneMap.set(delivery.dropoffZone, zoneNets);

    const pickupValues = pickupZoneMap.get(delivery.pickupZone) ?? [];
    pickupValues.push(net);
    pickupZoneMap.set(delivery.pickupZone, pickupValues);

    const dropoffValues = dropoffZoneMap.get(delivery.dropoffZone) ?? [];
    dropoffValues.push(net);
    dropoffZoneMap.set(delivery.dropoffZone, dropoffValues);

    const area = getZoneRegion(delivery.dropoffZone);
    if (area === "haifa") {
      haifaHourMap.set(bucket, (haifaHourMap.get(bucket) ?? 0) + net);
      areaScores.haifa.push(delivery.quickCheckResult.score);
    }
    if (area === "krayot") {
      krayotHourMap.set(bucket, (krayotHourMap.get(bucket) ?? 0) + net);
      areaScores.krayot.push(delivery.quickCheckResult.score);
    }
  });

  const bestDay = [...dayMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
  const bestHourRange = [...hourBucketMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
  const bestZone = [...zoneMap.entries()]
    .map(([zone, values]) => [zone, values.reduce((a, b) => a + b, 0) / values.length] as const)
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
  const bestPickupZone = [...pickupZoneMap.entries()]
    .map(([zone, values]) => [zone, values.reduce((a, b) => a + b, 0) / values.length] as const)
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
  const bestDropoffZone = [...dropoffZoneMap.entries()]
    .map(([zone, values]) => [zone, values.reduce((a, b) => a + b, 0) / values.length] as const)
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
  const bestTimeHaifa = [...haifaHourMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
  const bestTimeKrayot = [...krayotHourMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";

  const averageIlsPerHour = totalMinutes > 0 ? totalNet / (totalMinutes / 60) : 0;
  const averageMinutesPerDelivery = totalMinutes / completed.length;
  const avgScoreHaifa =
    areaScores.haifa.length > 0 ? areaScores.haifa.reduce((sum, score) => sum + score, 0) / areaScores.haifa.length : 0;
  const avgScoreKrayot =
    areaScores.krayot.length > 0
      ? areaScores.krayot.reduce((sum, score) => sum + score, 0) / areaScores.krayot.length
      : 0;

  return {
    bestDay,
    bestHourRange,
    bestZone,
    bestPickupZone,
    bestDropoffZone,
    bestTimeHaifa,
    bestTimeKrayot,
    averageIlsPerHour: round2(averageIlsPerHour),
    averageMinutesPerDelivery: round2(averageMinutesPerDelivery),
    avgScoreHaifa: round2(avgScoreHaifa),
    avgScoreKrayot: round2(avgScoreKrayot),
    lowProfitDeliveries,
    recommendationSummary:
      lowProfitDeliveries > completed.length * 0.25
        ? "כדאי לסנן יותר משלוחים באזורים חלשים ובשעות עומס."
        : "הביצועים יציבים. אפשר להתמקד בהגדלת נפח בשעות החזקות.",
    daySeries: [...dayMap.entries()].map(([day, profit]) => ({ day, profit: round2(profit) }))
  };
}

export function calculateZonePerformance(deliveries: Delivery[]): ZoneStats[] {
  const completed = getCompletedDeliveries(deliveries);
  const zoneMap = new Map<string, Delivery[]>();

  completed.forEach((delivery) => {
    const current = zoneMap.get(delivery.dropoffZone) ?? [];
    current.push(delivery);
    zoneMap.set(delivery.dropoffZone, current);
  });

  return [...zoneMap.entries()]
    .map(([zone, zoneDeliveries]) => {
      const deliveryCount = zoneDeliveries.length;
      const avgIncome =
        zoneDeliveries.reduce((sum, d) => sum + (d.completion?.actualAmount ?? d.offerAmount), 0) / deliveryCount;
      const avgDuration =
        zoneDeliveries.reduce((sum, d) => sum + (d.completion?.actualMinutes ?? d.estimatedMinutes), 0) / deliveryCount;
      const avgKm = zoneDeliveries.reduce((sum, d) => sum + (d.completion?.actualKm ?? d.estimatedKm), 0) / deliveryCount;
      const avgScore = zoneDeliveries.reduce((sum, d) => sum + d.quickCheckResult.score, 0) / deliveryCount;

      const demandScores = zoneDeliveries.map((d) => d.completion?.dropoffDemandQuality ?? "medium");
      const demandAgg = demandScores.reduce(
        (acc, q) => {
          acc[q] += 1;
          return acc;
        },
        { good: 0, medium: 0, bad: 0 }
      );
      const followUpDemandQuality: DropoffDemandQuality =
        demandAgg.good >= demandAgg.medium && demandAgg.good >= demandAgg.bad
          ? "good"
          : demandAgg.bad >= demandAgg.medium
            ? "bad"
            : "medium";

      const strengthLabel: ZoneStrength = avgScore >= 78 ? "strong" : avgScore >= 62 ? "medium" : "weak";

      return {
        zone,
        deliveryCount,
        avgIncome: round2(avgIncome),
        avgDuration: round2(avgDuration),
        avgKm: round2(avgKm),
        avgScore: round2(avgScore),
        followUpDemandQuality,
        strengthLabel
      };
    })
    .sort((a, b) => b.avgScore - a.avgScore);
}
