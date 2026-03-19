import type { BackupPayload, SavedDelivery, ScoringSettings, Verdict, NextOrderChance } from "./types";
import { BACKUP_SCHEMA_VERSION } from "./constants";

const VERDICTS: Verdict[] = ["שווה מאוד", "שווה", "גבולי", "לא שווה"];
const CHANCES: NextOrderChance[] = ["high", "medium", "low"];

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

function validateScoringSettings(x: unknown): ScoringSettings | null {
  if (!isRecord(x)) return null;
  const keys: (keyof ScoringSettings)[] = [
    "costPerKm",
    "peakBonus",
    "outOfHotZonePenalty",
    "lowChancePenalty",
    "mediumChancePenalty",
    "highChanceBonus"
  ];
  const out: Partial<ScoringSettings> = {};
  for (const k of keys) {
    const v = x[k];
    if (!isFiniteNumber(v)) return null;
    out[k] = v;
  }
  return out as ScoringSettings;
}

function validateDelivery(x: unknown): SavedDelivery | null {
  if (!isRecord(x)) return null;
  if (!isString(x.id) || !isString(x.createdAt)) return null;
  if (!isFiniteNumber(x.payout) || !isFiniteNumber(x.minutes) || !isFiniteNumber(x.km)) return null;
  if (!isBool(x.isPeakHour) || !isBool(x.inHotZone)) return null;
  if (!CHANCES.includes(x.nextOrderChance as NextOrderChance)) return null;
  if (!isFiniteNumber(x.ilsPerMinute) || !isFiniteNumber(x.ilsPerKm)) return null;
  if (!isFiniteNumber(x.score)) return null;
  if (!VERDICTS.includes(x.verdict as Verdict)) return null;
  if (!isString(x.explanation) || !isString(x.recommendation)) return null;

  const netPayout = isFiniteNumber(x.netPayout) ? x.netPayout : x.payout;
  const netIlsPerMinute = isFiniteNumber(x.netIlsPerMinute) ? x.netIlsPerMinute : x.ilsPerMinute;
  const netIlsPerKm = isFiniteNumber(x.netIlsPerKm) ? x.netIlsPerKm : x.ilsPerKm;

  return {
    ...(x as SavedDelivery),
    netPayout,
    netIlsPerMinute,
    netIlsPerKm
  };
}

export type ParseBackupResult =
  | { ok: true; payload: BackupPayload }
  | { ok: false; error: string };

/**
 * Strict validation for imported JSON — never trust file contents.
 */
export function parseBackupFile(json: unknown): ParseBackupResult {
  if (!isRecord(json)) {
    return { ok: false, error: "הקובץ אינו אובייקט JSON תקין." };
  }

  const version = json.version;
  if (version !== BACKUP_SCHEMA_VERSION) {
    return { ok: false, error: "גרסת גיבוי לא נתמכת." };
  }

  if (!Array.isArray(json.deliveries)) {
    return { ok: false, error: "חסרה רשימת משלוחים בגיבוי." };
  }

  const settings = validateScoringSettings(json.settings);
  if (!settings) {
    return { ok: false, error: "הגדרות הגיבוי פגומות או חסרות." };
  }

  const deliveries: SavedDelivery[] = [];
  for (let i = 0; i < json.deliveries.length; i++) {
    const row = validateDelivery(json.deliveries[i]);
    if (!row) {
      return { ok: false, error: `רשומת משלוח לא תקינה (שורה ${i + 1}).` };
    }
    deliveries.push(row);
  }

  const exportedAt = isString(json.exportedAt) ? json.exportedAt : new Date().toISOString();

  return {
    ok: true,
    payload: {
      version: BACKUP_SCHEMA_VERSION,
      deliveries,
      settings,
      exportedAt
    }
  };
}
