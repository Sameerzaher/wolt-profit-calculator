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

/** מחרוזות למשתמש */
const COPY = {
  distanceHigh: "מרחק גבוה מדי",
  nisKmGreat: "יחס \u20aa לק״מ מצוין",
  nisKmGood: "יחס \u20aa לק״מ טוב",
  nisKmMid: "יחס \u20aa לק״מ בגבול",
  nisKmLow: "יחס \u20aa לק״מ חלש",
  distanceSweet: "מרחק בטווח הנעים 2–5 ק״מ",
  doubleWorth: "משלוח כפול משפר את התמורה",
  leavesHot: "יוצא מהאזור החם",
  tipHelps: "טיפ במזומן משפר רווחיות",
  hourlyLow: "\u20aa לשעה חלשים",
  hourlyStrong: "\u20aa לשעה חזקים",
  rejectDistance: "מרחק גבוה מדי — עדיף לדלג",
  fallbackReason: "החלטה לפי ציון כללי",
  decisionStrong: "\ud83d\udfe2 קבלה חזקה",
  decisionAccept: "\u2705 לקבל",
  decisionDepends: "\u26a0\ufe0f תלוי",
  decisionReject: "\u274c לדחות"
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
    out.push(COPY.distanceHigh);
  }

  if (params.tier === "strong") {
    out.push(COPY.nisKmGreat);
  } else if (params.tier === "accept") {
    out.push(COPY.nisKmGood);
  } else if (params.tier === "depends") {
    out.push(COPY.nisKmMid);
  } else {
    out.push(COPY.nisKmLow);
  }

  if (params.distanceKm >= 2 && params.distanceKm <= 5) {
    out.push(COPY.distanceSweet);
  }

  if (params.isDoubleOrder) {
    out.push(COPY.doubleWorth);
  }

  if (params.leavesHotZone) {
    out.push(COPY.leavesHot);
  }

  if (params.tipBoost > 0) {
    out.push(COPY.tipHelps);
  }

  if (params.lowHourly) {
    out.push(COPY.hourlyLow);
  } else if (params.nisPerHour !== null && params.nisPerHour >= 85) {
    out.push(COPY.hourlyStrong);
  }

  return out;
}

/**
 * Courier decision engine: weighted score from NIS/km, NIS/hour (if time known),
 * distance band, tips, double bonus, hot-zone exit, weak hourly penalty.
 * Hard-rejects distance > MAX_DISTANCE_REJECT_KM. Guards NaN / divide-by-zero.
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
      ? COPY.rejectDistance
      : reasons.slice(0, 2).join(" \u00b7 ") || COPY.fallbackReason;

  return {
    nisPerKm,
    nisPerHour,
    score: Math.round(score),
    decision,
    reason,
    reasons
  };
}

export function decisionLabel(d: DecisionKind): string {
  switch (d) {
    case "strong_accept":
      return COPY.decisionStrong;
    case "accept":
      return COPY.decisionAccept;
    case "depends":
      return COPY.decisionDepends;
    default:
      return COPY.decisionReject;
  }
}

/** @deprecated Use decisionLabel */
export const decisionLabelHebrew = decisionLabel;

export function formatNisPerHour(n: number | null): string {
  if (n === null) return "—";
  return `${round1(n)} \u20aa/\u05e9\u05e2\u05d4`;
}
