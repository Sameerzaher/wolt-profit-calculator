import type { BackupPayload, DailySummaryPrefs, SavedDelivery } from "./types";
import { BACKUP_SCHEMA_VERSION, MAX_STORED_DELIVERIES } from "./constants";
import { normalizeSavedDelivery } from "./normalize";
import { validateDailyPrefs } from "./backup";

const STORAGE_KEY = "wolt_delivery_calculator_v2";
const LEGACY_STORAGE_KEY = "wolt_delivery_calculator_v1";
const THEME_KEY = "wolt_delivery_theme_v1";
const DAILY_PREFS_KEY = "wolt_daily_summary_prefs_v1";

function capDeliveries(list: SavedDelivery[]): SavedDelivery[] {
  return list.slice(0, MAX_STORED_DELIVERIES);
}

export function loadDeliveries(): SavedDelivery[] {
  if (typeof window === "undefined") return [];

  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!raw) return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const cleaned: SavedDelivery[] = [];
    for (const row of parsed) {
      const n = normalizeSavedDelivery(row);
      if (n) cleaned.push(n);
    }
    const out = capDeliveries(cleaned);
    if (!localStorage.getItem(STORAGE_KEY) && out.length > 0) {
      saveDeliveries(out);
      try {
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
    return out;
  } catch {
    return [];
  }
}

export function saveDeliveries(deliveries: SavedDelivery[]): void {
  if (typeof window === "undefined") return;
  try {
    const capped = capDeliveries(deliveries);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(capped));
  } catch {
    /* quota / private mode */
  }
}

export function addDelivery(delivery: SavedDelivery): SavedDelivery[] {
  const current = loadDeliveries();
  const updated = capDeliveries([delivery, ...current]);
  saveDeliveries(updated);
  return updated;
}

export function updateDeliveryById(id: string, delivery: SavedDelivery): SavedDelivery[] {
  const current = loadDeliveries();
  const updated = capDeliveries(current.map((item) => (item.id === id ? delivery : item)));
  saveDeliveries(updated);
  return updated;
}

export function deleteDeliveryById(id: string): SavedDelivery[] {
  const current = loadDeliveries();
  const updated = current.filter((item) => item.id !== id);
  saveDeliveries(updated);
  return updated;
}

export function clearAllDeliveries(): SavedDelivery[] {
  saveDeliveries([]);
  return [];
}

export function loadTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function saveTheme(theme: "light" | "dark"): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore */
  }
}

const defaultDailyPrefs: DailySummaryPrefs = {
  hoursWorked: 0,
  cashTipsNis: 0,
  extraCashTipsNis: 0,
  tipsInputMode: "from_history"
};

export function loadDailyPrefs(): DailySummaryPrefs {
  if (typeof window === "undefined") return defaultDailyPrefs;
  try {
    const raw = localStorage.getItem(DAILY_PREFS_KEY);
    if (!raw) return defaultDailyPrefs;
    const parsed = JSON.parse(raw) as unknown;
    const v = validateDailyPrefs(parsed);
    return v ?? defaultDailyPrefs;
  } catch {
    return defaultDailyPrefs;
  }
}

export function saveDailyPrefs(prefs: DailySummaryPrefs): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DAILY_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

export function exportBackupPayload(): BackupPayload {
  return {
    deliveries: loadDeliveries(),
    exportedAt: new Date().toISOString(),
    version: BACKUP_SCHEMA_VERSION
  };
}

/** Apply a payload already validated by parseBackupFile */
export function applyValidatedBackup(payload: BackupPayload): { deliveries: SavedDelivery[] } {
  const deliveries = capDeliveries(payload.deliveries);
  try {
    saveDeliveries(deliveries);
  } catch {
    /* best effort */
  }
  return { deliveries };
}
