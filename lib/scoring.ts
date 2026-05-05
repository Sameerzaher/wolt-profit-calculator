import { DECISION_THRESHOLDS } from "@/lib/constants";
import { getZoneRegion, mapTimeOfDayToPeakSlot, zoneMeta } from "@/data/zones";
import { calculateCost, calculateHourlyRate, calculateProfit } from "@/lib/calculations";
import { clamp, round2 } from "@/lib/utils";
import type { Decision, FuelSettings, QuickCheckInput, QuickCheckResult } from "@/types/models";

function inferDecision(score: number): Decision {
  if (score >= DECISION_THRESHOLDS.accept) return "accept";
  if (score >= DECISION_THRESHOLDS.borderline) return "borderline";
  return "skip";
}

function decisionToLabel(decision: Decision): QuickCheckResult["decisionLabel"] {
  if (decision === "accept") return "לקחת";
  if (decision === "borderline") return "גבולי";
  return "לדלג";
}

export function calculateFuelCost(km: number, settings: FuelSettings): number {
  const computed = settings.kmPerLiter > 0 ? settings.fuelPricePerLiter / settings.kmPerLiter : 0;
  const costPerKm = settings.costPerKm > 0 ? settings.costPerKm : computed;
  return calculateCost(km, costPerKm);
}

export function calculateQuickCheck(
  input: QuickCheckInput,
  fuelSettings: FuelSettings,
  preferredZones: string[] = []
): QuickCheckResult {
  void preferredZones;
  const estimatedFuelCost = calculateFuelCost(input.estimatedKm, fuelSettings);
  const estimatedNetProfit = calculateProfit(input.offerAmount, estimatedFuelCost);
  const estimatedIlsPerHour = calculateHourlyRate(estimatedNetProfit, input.estimatedMinutes / 60);

  const destinationMeta = zoneMeta[input.dropoffZone as keyof typeof zoneMeta];
  const destinationStrength = destinationMeta?.strength ?? "medium";
  const pickupRegion = getZoneRegion(input.pickupZone);
  const dropoffRegion = getZoneRegion(input.dropoffZone);
  const isCrossRegion = pickupRegion !== dropoffRegion && pickupRegion !== "other" && dropoffRegion !== "other";
  const peakSlot = mapTimeOfDayToPeakSlot(input.timeOfDay);
  const isPeakTime = peakSlot ? destinationMeta?.peak.includes(peakSlot) ?? false : false;
  const isStrongDestination = destinationStrength === "strong";
  const isWeakDestination = destinationStrength === "weak";
  const throwsOutOfHotZone = isCrossRegion && !isStrongDestination;

  let score = 50;
  const explanations: string[] = [];

  if (input.offerAmount >= 35) {
    score += 20;
    explanations.push("סכום טוב");
  } else if (input.offerAmount >= 28) {
    score += 12;
    explanations.push("סכום סביר");
  } else if (input.offerAmount >= 22) {
    score += 6;
  } else {
    explanations.push("סכום נמוך");
  }

  if (input.estimatedKm > 7) {
    score -= 12;
    explanations.push("מרחק גבוה");
  } else if (input.estimatedKm > 5) {
    score -= 8;
  } else if (input.estimatedKm > 3) {
    score -= 4;
  }

  if (input.estimatedMinutes > 35) {
    score -= 12;
    explanations.push("זמן ארוך");
  } else if (input.estimatedMinutes > 28) {
    score -= 8;
  } else if (input.estimatedMinutes > 22) {
    score -= 4;
  } else {
    explanations.push("זמן טוב");
  }

  if (destinationStrength === "strong") {
    score += 12;
    explanations.push("יעד חזק");
  } else if (destinationStrength === "medium") {
    score += 5;
  } else {
    score -= 10;
    explanations.push("יעד חלש");
  }

  if (isCrossRegion) {
    let crossPenalty = 0;
    if (pickupRegion === "haifa" && dropoffRegion === "krayot") crossPenalty = 8;
    if (pickupRegion === "krayot" && dropoffRegion === "haifa") crossPenalty = 6;
    if (crossPenalty > 0 && (input.dropoffZone === "BIG קריות" || input.dropoffZone === "צ׳ק פוסט")) {
      crossPenalty = Math.ceil(crossPenalty / 2);
    }
    score -= crossPenalty;
    if (crossPenalty >= 6) explanations.push(`זורק אותך מ${pickupRegion === "haifa" ? "חיפה" : "קריות"} ל${dropoffRegion === "haifa" ? "חיפה" : "קריות"}`);
  }

  if (isPeakTime) {
    score += 8;
    explanations.push("שעת שיא טובה");
  }

  if (input.hardParking) score -= 6;
  if (input.weatherBonus) score += 5;
  if (input.trafficLevel === "medium") score -= 4;
  if (input.trafficLevel === "high") score -= 8;

  score = clamp(Math.round(score), 0, 100);

  const decision = inferDecision(score);
  const decisionLabel = decisionToLabel(decision);
  let explanation = explanations.slice(0, 2).join(" אבל ");
  if (!explanation) explanation = "בדיקה סבירה";
  if (input.estimatedKm > 7 && score < 60) explanation = "מרחק גבוה ולא משתלם";
  if (isStrongDestination && input.estimatedMinutes <= 22) explanation = "יעד חזק וזמן טוב";
  if (destinationStrength === "weak" && input.offerAmount >= 30) explanation = "סכום טוב אבל יעד חלש";
  const smartWarning =
    input.offerAmount < 24 && (input.estimatedKm > 6 || input.estimatedMinutes > 30) ? "אזהרה: משלוח חלש" : undefined;

  return {
    score,
    decision,
    decisionLabel,
    estimatedIlsPerHour: round2(Math.max(0, estimatedIlsPerHour)),
    estimatedNetProfit: round2(estimatedNetProfit),
    explanation,
    smartWarning,
    isCrossRegion,
    isStrongDestination,
    isWeakDestination,
    isPeakTime,
    throwsOutOfHotZone
  };
}
