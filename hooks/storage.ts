"use client";

import { DEFAULT_APP_SETTINGS, DEFAULT_FUEL_SETTINGS, STORAGE_KEYS } from "@/lib/constants";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import type { AppSettings, Delivery, FuelSettings, Shift } from "@/types/models";

export function useDeliveriesStorage() {
  return useLocalStorageState<Delivery[]>(STORAGE_KEYS.deliveries, []);
}

export function useShiftsStorage() {
  return useLocalStorageState<Shift[]>(STORAGE_KEYS.shifts, []);
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
