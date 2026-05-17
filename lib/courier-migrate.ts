import type { DayShiftRecord, FuelSettings } from "@/types/models";
import type { DeliveryPlatform } from "@/types/platform";
import type { ShiftDay, ShiftSegment } from "@/types/shift";
import { DEFAULT_VEHICLE_SETTINGS, type VehicleSettings } from "@/types/vehicle";

const MIGRATION_FLAG = "courier_v5_migrated";

export function isCourierV5Migrated(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(MIGRATION_FLAG) === "1";
  } catch {
    return false;
  }
}

export function markCourierV5Migrated(): void {
  try {
    localStorage.setItem(MIGRATION_FLAG, "1");
  } catch {
    /* ignore */
  }
}

export function fuelSettingsToVehicle(fuel?: FuelSettings | null): VehicleSettings {
  if (!fuel) return { ...DEFAULT_VEHICLE_SETTINGS };
  return {
    type: "car",
    fuelCostPerKm: fuel.costPerKm ?? DEFAULT_VEHICLE_SETTINGS.fuelCostPerKm,
    monthlyInsurance: DEFAULT_VEHICLE_SETTINGS.monthlyInsurance,
    monthlyMaintenance: DEFAULT_VEHICLE_SETTINGS.monthlyMaintenance,
    monthlyVehicleCost: DEFAULT_VEHICLE_SETTINGS.monthlyVehicleCost
  };
}

export function migrateDayShiftRecord(record: DayShiftRecord): ShiftDay {
  return {
    id: record.shiftDate,
    date: record.shiftDate,
    segments: record.segments.map((legacy) => legacySegmentToSegment(legacy)),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function legacySegmentToSegment(legacy: DayShiftRecord["segments"][number]): ShiftSegment {
  const platform = normalizePlatform(legacy.platform);
  return {
    id: legacy.id,
    platform,
    startTime: legacy.startTime,
    endTime: legacy.endTime,
    endsNextDay: legacy.endsNextDay,
    income: legacy.incomeIls,
    kilometers: legacy.kilometers,
    deliveriesCount: 1,
    notes: legacy.notes,
    weather: "clear",
    rushHour: false
  };
}

function normalizePlatform(value: string): DeliveryPlatform {
  if (value === "tenbis" || value === "haat" || value === "wolt") return value;
  return "wolt";
}

export function mergeShiftDays(existing: ShiftDay[], incoming: ShiftDay[]): ShiftDay[] {
  const map = new Map<string, ShiftDay>();
  for (const day of existing) map.set(day.date, day);
  for (const day of incoming) {
    const prev = map.get(day.date);
    if (!prev || day.segments.length >= prev.segments.length) {
      map.set(day.date, { ...day, id: prev?.id ?? day.id, createdAt: prev?.createdAt ?? day.createdAt });
    }
  }
  return [...map.values()].sort((a, b) => b.date.localeCompare(a.date));
}
