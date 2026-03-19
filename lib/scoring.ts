import type { CalculationResult, CalculatorInput, ScoringSettings, Verdict } from "./types";

const MINUTES_FALLBACK = 1;
const KM_FALLBACK = 0.1;

function getBaseVerdict(ilsPerMinute: number): Verdict {
  if (ilsPerMinute > 2) return "שווה מאוד";
  if (ilsPerMinute >= 1.5) return "שווה";
  if (ilsPerMinute >= 1.2) return "גבולי";
  return "לא שווה";
}

function getVerdictByScore(score: number): Verdict {
  if (score > 2.05) return "שווה מאוד";
  if (score >= 1.45) return "שווה";
  if (score >= 1.2) return "גבולי";
  return "לא שווה";
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export const defaultScoringSettings: ScoringSettings = {
  costPerKm: 1.25,
  peakBonus: 0.1,
  outOfHotZonePenalty: 0.22,
  lowChancePenalty: 0.2,
  mediumChancePenalty: 0.08,
  highChanceBonus: 0.05
};

export function calculateDelivery(input: CalculatorInput, settings: ScoringSettings): CalculationResult {
  const payout = Math.max(0, Number.isFinite(input.payout) ? input.payout : 0);
  const minutes = Math.max(input.minutes, MINUTES_FALLBACK);
  const km = Math.max(input.km, KM_FALLBACK);

  const ilsPerMinute = payout / minutes;
  const ilsPerKm = payout / km;
  const netPayout = payout - km * settings.costPerKm;
  const safeNetPayout = Math.max(netPayout, 0);
  const netIlsPerMinute = safeNetPayout / minutes;
  const netIlsPerKm = safeNetPayout / km;
  const baseVerdict = getBaseVerdict(ilsPerMinute);

  let score = ilsPerMinute;
  const reasons: string[] = [];

  if (input.isPeakHour) {
    score += settings.peakBonus;
    reasons.push("שעת עומס מוסיפה מעט ערך");
  }

  if (!input.inHotZone) {
    score -= settings.outOfHotZonePenalty;
    reasons.push("היעד מחוץ לאזור חם ומגדיל סיכון לזמן מת");
  } else {
    reasons.push("היעד באזור טוב להזמנה הבאה");
  }

  if (input.nextOrderChance === "low") {
    score -= settings.lowChancePenalty;
    reasons.push("סיכוי נמוך להזמנה הבאה מוריד כדאיות");
  } else if (input.nextOrderChance === "medium") {
    score -= settings.mediumChancePenalty;
    reasons.push("סיכוי בינוני להזמנה הבאה");
  } else {
    score += settings.highChanceBonus;
    reasons.push("סיכוי גבוה להזמנה הבאה");
  }

  const verdict = getVerdictByScore(score);

  const recommendation =
    verdict === "שווה מאוד"
      ? "קח את המשלוח, הוא נראה משתלם מאוד לרכב."
      : verdict === "שווה"
        ? "נראה טוב, כדאי לקחת אם אין אופציה טובה יותר מיד."
        : verdict === "גבולי"
          ? "גבולי. קח רק אם אתה כבר קרוב לנקודת האיסוף."
          : "עדיף לדלג ולהמתין למשלוח חזק יותר.";

  const explanation = `בסיס חישוב: ${baseVerdict}. ${reasons.join(". ")}.`;

  return {
    ilsPerMinute: round2(ilsPerMinute),
    ilsPerKm: round2(ilsPerKm),
    netPayout: round2(safeNetPayout),
    netIlsPerMinute: round2(netIlsPerMinute),
    netIlsPerKm: round2(netIlsPerKm),
    score: round2(score),
    verdict,
    explanation,
    recommendation
  };
}
