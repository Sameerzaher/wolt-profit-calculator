import type { SavedDelivery, Verdict, NextOrderChance } from "./types";

const VERDICTS: Verdict[] = ["שווה מאוד", "שווה", "גבולי", "לא שווה"];
const CHANCES: NextOrderChance[] = ["high", "medium", "low"];

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

/**
 * Best-effort repair of one history row so a single bad entry never breaks the UI.
 */
export function normalizeSavedDelivery(raw: unknown): SavedDelivery | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== "string" || typeof raw.createdAt !== "string") return null;

  const payout = Number(raw.payout);
  const minutes = Number(raw.minutes);
  const km = Number(raw.km);

  if (!Number.isFinite(payout) || !Number.isFinite(minutes) || !Number.isFinite(km)) return null;

  const isPeakHour = Boolean(raw.isPeakHour);
  const inHotZone = Boolean(raw.inHotZone);
  const chance = CHANCES.includes(raw.nextOrderChance as NextOrderChance)
    ? (raw.nextOrderChance as NextOrderChance)
    : "medium";

  const ilsPerMinute = Number(raw.ilsPerMinute);
  const ilsPerKm = Number(raw.ilsPerKm);
  const netPayout = Number(raw.netPayout);
  const netIlsPerMinute = Number(raw.netIlsPerMinute);
  const netIlsPerKm = Number(raw.netIlsPerKm);
  const score = Number(raw.score);

  const verdict = VERDICTS.includes(raw.verdict as Verdict) ? (raw.verdict as Verdict) : "גבולי";
  const explanation = typeof raw.explanation === "string" ? raw.explanation : "";
  const recommendation = typeof raw.recommendation === "string" ? raw.recommendation : "";

  if (
    !Number.isFinite(ilsPerMinute) ||
    !Number.isFinite(ilsPerKm) ||
    !Number.isFinite(score)
  ) {
    return null;
  }

  const safeNetPayout = Number.isFinite(netPayout) ? netPayout : payout;
  const safeNetMin = Number.isFinite(netIlsPerMinute) ? netIlsPerMinute : ilsPerMinute;
  const safeNetKm = Number.isFinite(netIlsPerKm) ? netIlsPerKm : ilsPerKm;

  return {
    id: raw.id,
    createdAt: raw.createdAt,
    payout: Math.max(0, payout),
    minutes: Math.max(1, Math.round(minutes)),
    km: Math.max(0.1, km),
    isPeakHour,
    inHotZone,
    nextOrderChance: chance,
    ilsPerMinute,
    ilsPerKm,
    netPayout: safeNetPayout,
    netIlsPerMinute: safeNetMin,
    netIlsPerKm: safeNetKm,
    score,
    verdict,
    explanation,
    recommendation
  };
}
