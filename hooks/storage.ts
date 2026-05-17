"use client";

import { DEFAULT_APP_SETTINGS, DEFAULT_FUEL_SETTINGS, STORAGE_KEYS } from "@/lib/constants";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import type { AppSettings, AppShift, DayShiftRecord, Delivery, FuelSettings } from "@/types/models";

export function useDeliveriesStorage() {
  return useLocalStorageState<Delivery[]>(STORAGE_KEYS.deliveries, []);
}

export function useShiftsStorage() {
  return useLocalStorageState<AppShift[]>(STORAGE_KEYS.shifts, []);
}

export function usePreferredZonesStorage() {
  return useLocalStorageState<string[]>(STORAGE_KEYS.preferredZones, []);
}

export function useAppSettingsStorage() {
  return useLocalStorageState<AppSettings>(STORAGE_KEYS.appSettings, DEFAULT_APP_SETTINGS);
}

export function useFuelSettingsStorage() {
  return useLocalStorageState<FuelSettings>(STORAGE_KEYS.fuelSettings, DEFAULT_FUEL_SETTINGS);
}

export function useDayShiftsStorage() {
  return useLocalStorageState<DayShiftRecord[]>(STORAGE_KEYS.dayShifts, []);
}
