import { evaluateCourierOrder } from "./evaluateOrder";
import type { CalculatorInput, DecisionKind, SavedDelivery } from "./types";

const DECISIONS: DecisionKind[] = ["strong_accept", "accept", "depends", "reject"];

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function asDecision(x: unknown): DecisionKind | null {
  return typeof x === "string" && DECISIONS.includes(x as DecisionKind) ? (x as DecisionKind) : null;
}

/**
 * Best-effort repair of one history row so a single bad entry never breaks the UI.
 * Migrates legacy v1 rows (payout/km/minutes/...) into the courier assistant shape.
 */
export function normalizeSavedDelivery(raw: unknown): SavedDelivery | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== "string" || typeof raw.createdAt !== "string") return null;

  const hasNewShape = typeof raw.price === "number" && typeof raw.distanceKm === "number";

  if (hasNewShape) {
    const price = Number(raw.price);
    const distanceKm = Number(raw.distanceKm);
    const cashTip = Number.isFinite(Number(raw.cashTip)) ? Math.max(0, Number(raw.cashTip)) : 0;
    const isDoubleOrder = Boolean(raw.isDoubleOrder);
    const leavesHotZone = Boolean(raw.leavesHotZone);

    let estimatedMinutes: number | null = null;
    if (raw.estimatedMinutes === null || raw.estimatedMinutes === undefined) {
      estimatedMinutes = null;
    } else if (Number.isFinite(Number(raw.estimatedMinutes)) && Number(raw.estimatedMinutes) > 0) {
      estimatedMinutes = Math.round(Number(raw.estimatedMinutes));
    } else {
      return null;
    }

    if (!Number.isFinite(price) || !Number.isFinite(distanceKm)) return null;

    const input: CalculatorInput = {
      price: Math.max(0, price),
      distanceKm: Math.max(0.01, distanceKm),
      estimatedMinutes,
      cashTip,
      isDoubleOrder,
      leavesHotZone
    };

    const computed = evaluateCourierOrder(input);

    const nisPerKm = Number.isFinite(Number(raw.nisPerKm)) ? Number(raw.nisPerKm) : computed.nisPerKm;
    const nisPerHourRaw = raw.nisPerHour;
    const nisPerHour =
      nisPerHourRaw === null || nisPerHourRaw === undefined
        ? computed.nisPerHour
        : Number.isFinite(Number(nisPerHourRaw))
          ? Number(nisPerHourRaw)
          : computed.nisPerHour;

    const score = Number.isFinite(Number(raw.score)) ? Number(raw.score) : computed.score;
    const decision = asDecision(raw.decision) ?? computed.decision;
    const reason = typeof raw.reason === "string" ? raw.reason : computed.reason;
    const reasons = Array.isArray(raw.reasons) ? raw.reasons.filter((x) => typeof x === "string") : computed.reasons;

    return {
      ...input,
      nisPerKm,
      nisPerHour,
      score,
      decision,
      reason,
      reasons: reasons.length ? reasons : computed.reasons,
      id: raw.id,
      createdAt: raw.createdAt
    };
  }

  // Legacy v1 migration
  const payout = Number(raw.payout);
  const minutes = Number(raw.minutes);
  const km = Number(raw.km);
  if (!Number.isFinite(payout) || !Number.isFinite(minutes) || !Number.isFinite(km)) return null;

  const input: CalculatorInput = {
    price: Math.max(0, payout),
    distanceKm: Math.max(0.01, km),
    estimatedMinutes: minutes > 0 ? Math.max(1, Math.round(minutes)) : null,
    cashTip: 0,
    isDoubleOrder: false,
    leavesHotZone: raw.inHotZone === undefined ? false : !Boolean(raw.inHotZone)
  };

  return {
    ...input,
    ...evaluateCourierOrder(input),
    id: raw.id,
    createdAt: raw.createdAt
  };
}
