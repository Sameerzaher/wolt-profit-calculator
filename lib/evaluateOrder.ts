import {
  DOUBLE_NIS_PER_KM_RELAX,
  DOUBLE_ORDER_SCORE_BONUS,
  LEAVES_HOT_ZONE_SCORE_PENALTY,
  LOW_HOURLY_SCORE_PENALTY,
  LOW_HOURLY_THRESHOLD,
  MAX_DISTANCE_REJECT_KM,
  NIS_PER_KM_ACCEPT,
  NIS_PER_KM_DEPENDS,
  NIS_PER_KM_STRONG,
  SCORE_ACCEPT_MIN,
  SCORE_DEPENDS_MIN,
  SCORE_STRONG_ACCEPT_MIN
} from "./decisionConstants";
import type { CalculatorInput, DecisionKind, OrderEvaluation } from "./types";

/** Hebrew UI strings (Unicode escapes keep the file encoding-safe on Windows editors) */
const H = {
  distanceHigh:
    "\u05de\u05e8\u05d7\u05e7 \u05d2\u05d1\u05d5\u05d4 \u05de\u05d3\u05d9",
  nisKmGreat:
    "\u05d9\u05d7\u05e1 \u20aa/\u05e7\u05f4\u05de \u05de\u05e6\u05d5\u05d9\u05df",
  nisKmGood: "\u05d9\u05d7\u05e1 \u20aa/\u05e7\u05f4\u05de \u05d8\u05d5\u05d1",
  nisKmMid: "\u05d9\u05d7\u05e1 \u20aa/\u05e7\u05f4\u05de \u05d1\u05d9\u05e0\u05d5\u05e0\u05d9",
  nisKmLow:
    "\u05d9\u05d7\u05e1 \u20aa/\u05e7\u05f4\u05de \u05e0\u05de\u05d5\u05da \u05d9\u05d7\u05e1\u05d9\u05ea",
  distanceSweet:
    "\u05d1\u05d8\u05d5\u05d5\u05d7 2\u20135 \u05e7\u05f4\u05de \u2014 \u05d1\u05d3\u05e8\u05da \u05db\u05dc\u05dc \u05d4\u05db\u05d9 \u05e0\u05d5\u05d7",
  doubleWorth: "\u05d3\u05d0\u05d1\u05dc \u05de\u05e9\u05ea\u05dc\u05dd",
  leavesHot:
    "\u05d4\u05d6\u05de\u05e0\u05d4 \u05de\u05d5\u05e6\u05d9\u05d0\u05d4 \u05d0\u05d5\u05ea\u05da \u05de\u05d4\u05d0\u05d6\u05d5\u05e8 \u05d4\u05d7\u05dd",
  tipHelps:
    "\u05d8\u05d9\u05e4 \u05de\u05e9\u05e4\u05e8 \u05de\u05e9\u05de\u05e2\u05d5\u05ea\u05d9\u05ea \u05d0\u05ea \u05d4\u05e8\u05d5\u05d5\u05d7",
  hourlyLow: "\u20aa/\u05e9\u05e2\u05d4 \u05e0\u05de\u05d5\u05da \u05d9\u05d7\u05e1\u05d9\u05ea",
  hourlyStrong: "\u20aa/\u05e9\u05e2\u05d4 \u05d7\u05d6\u05e7",
  rejectDistance:
    "\u05de\u05e8\u05d7\u05e7 \u05d2\u05d1\u05d5\u05d4 \u05de\u05d3\u05d9 \u2014 \u05e2\u05d3\u05d9\u05e3 \u05dc\u05d3\u05dc\u05d2",
  fallbackReason: "\u05d4\u05d7\u05dc\u05d8\u05d4 \u05dc\u05e4\u05d9 \u05e6\u05d9\u05d5\u05df \u05db\u05d5\u05dc\u05dc",
  decisionStrong: "\ud83d\udfe2 \u05dc\u05e7\u05d7\u05ea \u05d1\u05d7\u05d5\u05dd",
  decisionAccept: "\u2705 \u05db\u05d3\u05d0\u05d9 \u05dc\u05e7\u05d7\u05ea",
  decisionDepends: "\u26a0\ufe0f \u05ea\u05dc\u05d5\u05d9",
  decisionReject: "\u274c \u05e2\u05d3\u05d9\u05e3 \u05dc\u05d3\u05dc\u05d2"
} as const;

const MIN_KM = 0.01;
const MIN_MINUTES = 1;

function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function distanceBandScore(km: number): number {
  if (km >= 2 && km <= 5) return 16;
  if (km >= 1 && km < 2) return 13;
  if (km > 5 && km <= 7) return 12;
  if (km > 7 && km <= MAX_DISTANCE_REJECT_KM) return 8;
  if (km > 0 && km < 1) return 11;
  return 10;
}

function nisKmCurve(nisPerKm: number): number {
  return clamp((nisPerKm - 3.5) / 4.2, 0, 1) * 50;
}

function hourlyCurve(nisPerHour: number | null): number {
  if (nisPerHour === null) return 10;
  return clamp((nisPerHour - 42) / 95, 0, 1) * 22;
}

function tipScore(price: number, cashTip: number): number {
  const tip = Math.max(0, cashTip);
  if (tip <= 0) return 0;
  const ratio = price > 0 ? tip / price : 0;
  const fromAmount = clamp(tip * 0.35, 0, 10);
  const fromRatio = ratio >= 0.12 ? 6 : ratio >= 0.06 ? 3 : 0;
  return clamp(fromAmount + fromRatio, 0, 12);
}

function tierFromNisPerKm(nisPerKm: number, isDoubleOrder: boolean): "strong" | "accept" | "depends" | "weak" {
  const relax = isDoubleOrder ? DOUBLE_NIS_PER_KM_RELAX : 0;
  const n = nisPerKm + relax;
  if (n >= NIS_PER_KM_STRONG) return "strong";
  if (n >= NIS_PER_KM_ACCEPT) return "accept";
  if (n >= NIS_PER_KM_DEPENDS) return "depends";
  return "weak";
}

function decisionFromScore(score: number, distanceKm: number): DecisionKind {
  if (distanceKm > MAX_DISTANCE_REJECT_KM) return "reject";
  if (score >= SCORE_STRONG_ACCEPT_MIN) return "strong_accept";
  if (score >= SCORE_ACCEPT_MIN) return "accept";
  if (score >= SCORE_DEPENDS_MIN) return "depends";
  return "reject";
}

function buildReasons(params: {
  nisPerKm: number;
  nisPerHour: number | null;
  distanceKm: number;
  isDoubleOrder: boolean;
  leavesHotZone: boolean;
  cashTip: number;
  price: number;
  tier: ReturnType<typeof tierFromNisPerKm>;
  lowHourly: boolean;
  tipBoost: number;
}): string[] {
  const out: string[] = [];

  if (params.distanceKm > MAX_DISTANCE_REJECT_KM) {
    out.push(H.distanceHigh);
  }

  if (params.tier === "strong") {
    out.push(H.nisKmGreat);
  } else if (params.tier === "accept") {
    out.push(H.nisKmGood);
  } else if (params.tier === "depends") {
    out.push(H.nisKmMid);
  } else {
    out.push(H.nisKmLow);
  }

  if (params.distanceKm >= 2 && params.distanceKm <= 5) {
    out.push(H.distanceSweet);
  }

  if (params.isDoubleOrder) {
    out.push(H.doubleWorth);
  }

  if (params.leavesHotZone) {
    out.push(H.leavesHot);
  }

  if (params.tipBoost > 0) {
    out.push(H.tipHelps);
  }

  if (params.lowHourly) {
    out.push(H.hourlyLow);
  } else if (params.nisPerHour !== null && params.nisPerHour >= 85) {
    out.push(H.hourlyStrong);
  }

  return out;
}

/**
 * Core courier decision: NIS/km, optional NIS/hour, distance, tip, double, and hot-zone exit.
 * Safe for empty tip / missing minutes — avoids NaN and division by zero.
 */
export function evaluateCourierOrder(input: CalculatorInput): OrderEvaluation {
  const price = Math.max(0, Number.isFinite(input.price) ? input.price : 0);
  const distanceKm = Math.max(MIN_KM, Number.isFinite(input.distanceKm) ? input.distanceKm : MIN_KM);
  const cashTip = Math.max(0, Number.isFinite(input.cashTip) ? input.cashTip : 0);
  const total = price + cashTip;

  const minutesRaw = input.estimatedMinutes;
  const hasMinutes =
    minutesRaw !== null && minutesRaw !== undefined && Number.isFinite(minutesRaw) && minutesRaw > 0;
  const minutes = hasMinutes ? Math.max(MIN_MINUTES, minutesRaw as number) : null;

  const nisPerKm = round2(total / distanceKm);
  const nisPerHour = minutes !== null ? round2(total / (minutes / 60)) : null;

  let score = 20;
  score += nisKmCurve(nisPerKm);
  score += hourlyCurve(nisPerHour);
  score += distanceBandScore(distanceKm);
  const tipPts = tipScore(price, cashTip);
  score += tipPts;

  if (input.isDoubleOrder) score += DOUBLE_ORDER_SCORE_BONUS;
  if (input.leavesHotZone) score -= LEAVES_HOT_ZONE_SCORE_PENALTY;

  const lowHourly = nisPerHour !== null && nisPerHour < LOW_HOURLY_THRESHOLD;
  if (lowHourly) score -= LOW_HOURLY_SCORE_PENALTY;

  score = clamp(score, 0, 100);

  const tier = tierFromNisPerKm(nisPerKm, input.isDoubleOrder);
  let decision = decisionFromScore(score, distanceKm);

  if (distanceKm <= MAX_DISTANCE_REJECT_KM && tier === "strong" && score < SCORE_ACCEPT_MIN) {
    score = Math.max(score, SCORE_ACCEPT_MIN + 1);
    decision = decisionFromScore(score, distanceKm);
  }

  if (distanceKm > MAX_DISTANCE_REJECT_KM) {
    score = Math.min(score, SCORE_DEPENDS_MIN - 1);
    decision = "reject";
  }

  const reasons = buildReasons({
    nisPerKm,
    nisPerHour,
    distanceKm,
    isDoubleOrder: input.isDoubleOrder,
    leavesHotZone: input.leavesHotZone,
    cashTip,
    price,
    tier,
    lowHourly,
    tipBoost: tipPts
  });

  const reason =
    distanceKm > MAX_DISTANCE_REJECT_KM
      ? H.rejectDistance
      : reasons.slice(0, 2).join(" \u00b7 ") || H.fallbackReason;

  return {
    nisPerKm,
    nisPerHour,
    score: Math.round(score),
    decision,
    reason,
    reasons
  };
}

export function decisionLabelHebrew(d: DecisionKind): string {
  switch (d) {
    case "strong_accept":
      return H.decisionStrong;
    case "accept":
      return H.decisionAccept;
    case "depends":
      return H.decisionDepends;
    default:
      return H.decisionReject;
  }
}

export function formatNisPerHour(n: number | null): string {
  if (n === null) return "\u2014";
  return `${round1(n)} \u20aa/\u05e9\u05e2\u05d4`;
}
