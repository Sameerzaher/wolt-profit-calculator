import { STORAGE_KEYS } from "@/lib/constants";
import { fuelSettingsToVehicle, isCourierV5Migrated, markCourierV5Migrated, mergeShiftDays, migrateDayShiftRecord } from "@/lib/courier-migrate";
import type { ShiftDay } from "@/types/shift";
import { DEFAULT_VEHICLE_SETTINGS, type VehicleSettings } from "@/types/vehicle";
import type { DayShiftRecord, FuelSettings } from "@/types/models";

export interface CourierPersistedState {
  shiftDays: ShiftDay[];
  vehicle: VehicleSettings;
  schemaVersion: 5;
}

export const COURIER_SCHEMA_VERSION = 5 as const;

export function readCourierState(): CourierPersistedState {
  const raw = safeRead<CourierPersistedState | null>(STORAGE_KEYS.courierApp, null);
  if (raw && raw.schemaVersion === 5) {
    return {
      shiftDays: raw.shiftDays ?? [],
      vehicle: { ...DEFAULT_VEHICLE_SETTINGS, ...raw.vehicle },
      schemaVersion: 5
    };
  }
  return runMigrationFromLegacy();
}

export function writeCourierState(state: CourierPersistedState): void {
  safeWrite(STORAGE_KEYS.courierApp, { ...state, schemaVersion: 5 as const });
}

export function runMigrationFromLegacy(): CourierPersistedState {
  if (typeof window === "undefined") {
    return { shiftDays: [], vehicle: { ...DEFAULT_VEHICLE_SETTINGS }, schemaVersion: 5 };
  }

  if (isCourierV5Migrated()) {
    const current = safeRead<CourierPersistedState | null>(STORAGE_KEYS.courierApp, null);
    if (current) {
      return {
        shiftDays: current.shiftDays ?? [],
        vehicle: { ...DEFAULT_VEHICLE_SETTINGS, ...current.vehicle },
        schemaVersion: 5
      };
    }
  }

  const legacyDays = safeRead<DayShiftRecord[]>(STORAGE_KEYS.dayShifts, []);
  const legacyFuel = safeRead<FuelSettings | null>(STORAGE_KEYS.fuelSettings, null);
  const migratedDays = legacyDays.map(migrateDayShiftRecord);
  const state: CourierPersistedState = {
    shiftDays: mergeShiftDays([], migratedDays),
    vehicle: fuelSettingsToVehicle(legacyFuel),
    schemaVersion: 5
  };

  writeCourierState(state);
  markCourierV5Migrated();
  return state;
}

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}
