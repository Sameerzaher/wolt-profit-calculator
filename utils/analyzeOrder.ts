import type { CalculatorInput, DecisionKind, OrderEvaluation } from "@/lib/types";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function clampScore(s: number): number {
  return Math.min(100, Math.max(0, Math.round(s)));
}

function decisionFromScore(score: number): DecisionKind {
  if (score >= 85) return "strong_accept";
  if (score >= 70) return "accept";
  if (score >= 55) return "depends";
  return "reject";
}

/**
 * מנוע כללים מהיר (ללא AI): ציון 0–100, החלטה, סיבות.
 * total = price + cashTip; nisPerHour רק כשיש estimatedMinutes חיובי.
 */
export function analyzeOrder(input: CalculatorInput): OrderEvaluation {
  const cashTip = Math.max(0, Number.isFinite(input.cashTip) ? input.cashTip : 0);
  const price = Math.max(0, Number.isFinite(input.price) ? input.price : 0);
  const total = price + cashTip;
  const dist = Math.max(0.01, Number.isFinite(input.distanceKm) ? input.distanceKm : 0.01);

  const nisPerKm = round2(total / dist);

  let nisPerHour: number | null = null;
  const mins = input.estimatedMinutes;
  if (mins !== null && mins !== undefined && Number.isFinite(mins) && mins > 0) {
    nisPerHour = round2((total / mins) * 60);
  }

  let score = 0;
  const reasons: string[] = [];

  if (nisPerKm >= 7) {
    score += 40;
    reasons.push("יחס \u20aa לק״מ גבוה מאוד");
  } else if (nisPerKm >= 6) {
    score += 35;
    reasons.push("יחס \u20aa לק״מ גבוה");
  } else if (nisPerKm >= 5) {
    score += 25;
    reasons.push("יחס \u20aa לק״מ טוב");
  } else if (nisPerKm >= 4.5) {
    score += 15;
    reasons.push("יחס \u20aa לק״מ בינוני");
  } else {
    score += 5;
    reasons.push("יחס \u20aa לק״מ נמוך");
  }

  if (nisPerHour !== null) {
    if (nisPerHour >= 90) {
      score += 25;
      reasons.push("תעריף לשעה מצוין");
    } else if (nisPerHour >= 75) {
      score += 20;
      reasons.push("תעריף לשעה טוב");
    } else if (nisPerHour >= 60) {
      score += 15;
      reasons.push("תעריף לשעה סביר");
    } else {
      score += 5;
      reasons.push("תעריף לשעה חלש");
    }
  } else {
    score += 5;
  }

  if (dist > 8) {
    score -= 25;
    reasons.push("מרחק ארוך מדי (מעל 8 ק״מ)");
  } else if (dist > 6) {
    score -= 10;
    reasons.push("מרחק ארוך (מעל 6 ק״מ)");
  }

  if (input.isDoubleOrder) {
    score += 10;
    reasons.push("בונוס משלוח כפול");
  }
  if (cashTip > 0) {
    score += 10;
    reasons.push("טיפ במזומן משפר את התמורה");
  }
  if (input.leavesHotZone) {
    score -= 15;
    reasons.push("יוצא מהאזור החם");
  }

  score = clampScore(score);
  const decision = decisionFromScore(score);

  const reason = reasons.slice(0, 2).join(" \u00b7 ") || "ניתוח לפי כללי התמורה";

  return {
    nisPerKm,
    nisPerHour,
    score,
    decision,
    reason,
    reasons
  };
}

export function decisionLabel(d: DecisionKind): string {
  switch (d) {
    case "strong_accept":
      return "\ud83d\udfe2 קבלה חזקה";
    case "accept":
      return "\u2705 לקבל";
    case "depends":
      return "\u26a0\ufe0f אולי";
    default:
      return "\u274c לדחות";
  }
}

export function formatNisPerHour(n: number | null): string {
  if (n === null) return "\u2014";
  return `${round2(n)} \u20aa/\u05e9\u05e2\u05d4`;
}
