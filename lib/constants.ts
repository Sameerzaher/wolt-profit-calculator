import type { AppSettings, FuelSettings } from "@/types/models";

export const STORAGE_KEYS = {
  deliveries: "woltcalc_v2_deliveries",
  shifts: "woltcalc_v2_shifts",
  preferredZones: "woltcalc_v2_preferred_zones",
  appSettings: "woltcalc_v2_app_settings",
  fuelSettings: "woltcalc_v2_fuel_settings",
  screenshotLastAnalysis: "woltcalc_v2_screenshot_last_analysis",
  dayShifts: "woltcalc_v2_day_shifts"
} as const;

export const DAY_SHIFT_STORAGE_PREFIX = "woltcalc_day_" as const;

export const DEFAULT_FUEL_SETTINGS: FuelSettings = {
  vehicleName: "Lexus CT200h",
  kmPerLiter: 20,
  fuelPricePerLiter: 7.5,
  costPerKm: 0.5
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  dailyTarget: 500,
  currency: "ILS",
  onboardingDone: false,
  demoMode: false,
  activeDeliveryId: null,
  activeShiftId: null
};

export const DECISION_THRESHOLDS = {
  accept: 80,
  borderline: 60
} as const;
/** Max stored deliveries to keep localStorage fast and UI responsive */
export const MAX_STORED_DELIVERIES = 150;

/** Israel timezone for consistent "today" / display */
export const TIME_ZONE_IL = "Asia/Jerusalem";

/** Backup file schema version — bump when structure changes */
export const BACKUP_SCHEMA_VERSION = 4 as const;

/** Weekly gross goal (₪) for monthly dashboard — stored in localStorage */
export const WEEKLY_GOAL_STORAGE_KEY = "woltcalc_weekly_goal_ils";

/** Previous schema still accepted for import-only migration */
export const BACKUP_SCHEMA_VERSION_V1 = 1 as const;
