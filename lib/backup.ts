import { evaluateCourierOrder } from "./evaluateOrder";
import type { BackupPayload, CalculatorInput, DailySummaryPrefs, SavedDelivery, DecisionKind } from "./types";
import { BACKUP_SCHEMA_VERSION, BACKUP_SCHEMA_VERSION_V1 } from "./constants";

const DECISIONS: DecisionKind[] = ["strong_accept", "accept", "depends", "reject"];

type LegacyVerdict = "\u05e9\u05d5\u05d5\u05d4 \u05de\u05d0\u05d5\u05d3" | "\u05e9\u05d5\u05d5\u05d4" | "\u05d2\u05d1\u05d5\u05dc\u05d9" | "\u05dc\u05d0 \u05e9\u05d5\u05d5\u05d4";
const LEGACY_VERDICTS: LegacyVerdict[] = ["\u05e9\u05d5\u05d5\u05d4 \u05de\u05d0\u05d5\u05d3", "\u05e9\u05d5\u05d5\u05d4", "\u05d2\u05d1\u05d5\u05dc\u05d9", "\u05dc\u05d0 \u05e9\u05d5\u05d5\u05d4"];

type LegacyNextOrderChance = "high" | "medium" | "low";
const CHANCES: LegacyNextOrderChance[] = ["high", "medium", "low"];

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function isFiniteNumber(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

function isString(x: unknown): x is string {
  return typeof x === "string";
}

function isBool(x: unknown): x is boolean {
  return typeof x === "boolean";
}

function validateDecision(x: unknown): DecisionKind | null {
  return typeof x === "string" && DECISIONS.includes(x as DecisionKind) ? (x as DecisionKind) : null;
}

function validateDeliveryV2(x: unknown): SavedDelivery | null {
  if (!isRecord(x)) return null;
  if (!isString(x.id) || !isString(x.createdAt)) return null;
  if (!isFiniteNumber(x.price) || !isFiniteNumber(x.distanceKm)) return null;
  if (!isBool(x.isDoubleOrder) || !isBool(x.leavesHotZone)) return null;
  if (!isFiniteNumber(x.cashTip) || x.cashTip < 0) return null;

  if (x.estimatedMinutes !== null && x.estimatedMinutes !== undefined) {
    if (!isFiniteNumber(x.estimatedMinutes) || x.estimatedMinutes <= 0) return null;
  }

  if (!isFiniteNumber(x.nisPerKm)) return null;
  if (!isFiniteNumber(x.score)) return null;
  const decision = validateDecision(x.decision);
  if (!decision) return null;
  if (!isString(x.reason)) return null;
  if (!Array.isArray(x.reasons) || !x.reasons.every((r) => typeof r === "string")) return null;

  let nisPerHour: number | null = null;
  if (x.nisPerHour === null || x.nisPerHour === undefined) {
    nisPerHour = null;
  } else if (isFiniteNumber(x.nisPerHour)) {
    nisPerHour = x.nisPerHour;
  } else {
    return null;
  }

  const input: CalculatorInput = {
    price: x.price,
    distanceKm: x.distanceKm,
    estimatedMinutes:
      x.estimatedMinutes === null || x.estimatedMinutes === undefined
        ? null
        : Math.round(x.estimatedMinutes as number),
    cashTip: x.cashTip,
    isDoubleOrder: x.isDoubleOrder,
    leavesHotZone: x.leavesHotZone
  };

  return {
    ...input,
    nisPerKm: x.nisPerKm,
    nisPerHour,
    score: x.score,
    decision,
    reason: x.reason,
    reasons: x.reasons as string[],
    id: x.id,
    createdAt: x.createdAt
  };
}

function validateLegacyDelivery(x: unknown): SavedDelivery | null {
  if (!isRecord(x)) return null;
  if (!isString(x.id) || !isString(x.createdAt)) return null;
  if (!isFiniteNumber(x.payout) || !isFiniteNumber(x.minutes) || !isFiniteNumber(x.km)) return null;
  if (!isBool(x.isPeakHour) || !isBool(x.inHotZone)) return null;
  if (!CHANCES.includes(x.nextOrderChance as LegacyNextOrderChance)) return null;
  if (!isFiniteNumber(x.ilsPerMinute) || !isFiniteNumber(x.ilsPerKm)) return null;
  if (!isFiniteNumber(x.score)) return null;
  if (!LEGACY_VERDICTS.includes(x.verdict as LegacyVerdict)) return null;
  if (!isString(x.explanation) || !isString(x.recommendation)) return null;

  const input: CalculatorInput = {
    price: Math.max(0, x.payout),
    distanceKm: Math.max(0.01, x.km),
    estimatedMinutes: x.minutes > 0 ? Math.max(1, Math.round(x.minutes)) : null,
    cashTip: 0,
    isDoubleOrder: false,
    leavesHotZone: !x.inHotZone
  };

  return {
    ...input,
    ...evaluateCourierOrder(input),
    id: x.id,
    createdAt: x.createdAt
  };
}

export type ParseBackupResult =
  | { ok: true; payload: BackupPayload }
  | { ok: false; error: string };

/**
 * Strict validation for imported JSON — never trust file contents.
 * Accepts v1 backups by migrating rows; v2 must be fully valid.
 */
export function parseBackupFile(json: unknown): ParseBackupResult {
  if (!isRecord(json)) {
    return { ok: false, error: "\u05d4\u05e7\u05d5\u05d1\u05e5 \u05d0\u05d9\u05e0\u05d5 \u05d0\u05d5\u05d1\u05d9\u05d9\u05e7\u05d8 JSON \u05ea\u05e7\u05d9\u05df." };
  }

  const version = json.version;
  if (version !== BACKUP_SCHEMA_VERSION && version !== BACKUP_SCHEMA_VERSION_V1) {
    return { ok: false, error: "\u05d2\u05e8\u05e1\u05ea \u05d2\u05d9\u05d1\u05d5\u05d9 \u05dc\u05d0 \u05e0\u05ea\u05de\u05db\u05ea." };
  }

  if (!Array.isArray(json.deliveries)) {
    return { ok: false, error: "\u05d7\u05e1\u05e8\u05d4 \u05e8\u05e9\u05d9\u05de\u05ea \u05de\u05e9\u05dc\u05d5\u05d7\u05d9\u05dd \u05d1\u05d2\u05d9\u05d1\u05d5\u05d9." };
  }

  if (version === BACKUP_SCHEMA_VERSION_V1) {
    if (!isRecord(json.settings)) {
      return { ok: false, error: "\u05d1\u05d2\u05d9\u05d1\u05d5\u05d9 v1 \u05d7\u05e1\u05e8\u05d5\u05ea \u05d4\u05d2\u05d3\u05e8\u05d5\u05ea." };
    }
    const deliveries: SavedDelivery[] = [];
    for (let i = 0; i < json.deliveries.length; i++) {
      const row = validateLegacyDelivery(json.deliveries[i]);
      if (!row) {
        return {
          ok: false,
          error: `\u05e8\u05e9\u05d5\u05de\u05ea \u05de\u05e9\u05dc\u05d5\u05d7 \u05dc\u05d0 \u05ea\u05e7\u05d9\u05e0\u05d4 (\u05e9\u05d5\u05e8\u05d4 ${i + 1}).`
        };
      }
      deliveries.push(row);
    }
    const exportedAt = isString(json.exportedAt) ? json.exportedAt : new Date().toISOString();
    return {
      ok: true,
      payload: {
        version: BACKUP_SCHEMA_VERSION,
        deliveries,
        exportedAt
      }
    };
  }

  const deliveries: SavedDelivery[] = [];
  for (let i = 0; i < json.deliveries.length; i++) {
    const row = validateDeliveryV2(json.deliveries[i]);
    if (!row) {
      return {
        ok: false,
        error: `\u05e8\u05e9\u05d5\u05de\u05ea \u05de\u05e9\u05dc\u05d5\u05d7 \u05dc\u05d0 \u05ea\u05e7\u05d9\u05e0\u05d4 (\u05e9\u05d5\u05e8\u05d4 ${i + 1}).`
      };
    }
    deliveries.push(row);
  }

  const exportedAt = isString(json.exportedAt) ? json.exportedAt : new Date().toISOString();

  return {
    ok: true,
    payload: {
      version: BACKUP_SCHEMA_VERSION,
      deliveries,
      exportedAt
    }
  };
}

export function validateDailyPrefs(x: unknown): DailySummaryPrefs | null {
  if (!isRecord(x)) return null;
  if (!isFiniteNumber(x.hoursWorked) || x.hoursWorked < 0) return null;
  if (!isFiniteNumber(x.cashTipsNis) || x.cashTipsNis < 0) return null;
  if (x.tipsInputMode !== "from_history" && x.tipsInputMode !== "manual") return null;
  const extraCashTipsNis =
    isFiniteNumber(x.extraCashTipsNis) && x.extraCashTipsNis >= 0 ? x.extraCashTipsNis : 0;
  return {
    hoursWorked: x.hoursWorked,
    cashTipsNis: x.cashTipsNis,
    extraCashTipsNis,
    tipsInputMode: x.tipsInputMode
  };
}
