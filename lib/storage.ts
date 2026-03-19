import { defaultScoringSettings } from "./scoring";
import type { BackupPayload, SavedDelivery, ScoringSettings } from "./types";
import { BACKUP_SCHEMA_VERSION, MAX_STORED_DELIVERIES } from "./constants";
import { normalizeSavedDelivery } from "./normalize";

const STORAGE_KEY = "wolt_delivery_calculator_v1";
const THEME_KEY = "wolt_delivery_theme_v1";
const SETTINGS_KEY = "wolt_scoring_settings_v1";

function capDeliveries(list: SavedDelivery[]): SavedDelivery[] {
  return list.slice(0, MAX_STORED_DELIVERIES);
}

export function loadDeliveries(): SavedDelivery[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const cleaned: SavedDelivery[] = [];
    for (const row of parsed) {
      const n = normalizeSavedDelivery(row);
      if (n) cleaned.push(n);
    }
    return capDeliveries(cleaned);
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

export function loadScoringSettings(): ScoringSettings {
  if (typeof window === "undefined") return defaultScoringSettings;

  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultScoringSettings;
    const parsed = JSON.parse(raw) as Partial<ScoringSettings>;
    return {
      ...defaultScoringSettings,
      ...parsed
    };
  } catch {
    return defaultScoringSettings;
  }
}

export function saveScoringSettings(settings: ScoringSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

export function exportBackupPayload(): BackupPayload {
  return {
    deliveries: loadDeliveries(),
    settings: loadScoringSettings(),
    exportedAt: new Date().toISOString(),
    version: BACKUP_SCHEMA_VERSION
  };
}

/** Apply a payload already validated by parseBackupFile */
export function applyValidatedBackup(payload: BackupPayload): {
  deliveries: SavedDelivery[];
  settings: ScoringSettings;
} {
  const deliveries = capDeliveries(payload.deliveries);
  try {
    saveDeliveries(deliveries);
    saveScoringSettings(payload.settings);
  } catch {
    /* best effort */
  }
  return { deliveries, settings: payload.settings };
}
