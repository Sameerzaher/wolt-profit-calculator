"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { COURIER_SCHEMA_VERSION, readCourierState, writeCourierState, type CourierPersistedState } from "@/lib/courier-storage";
import { mergeShiftDays } from "@/lib/courier-migrate";
import { STORAGE_KEYS } from "@/lib/constants";
import type { ShiftDay, ShiftSegment } from "@/types/shift";
import { DEFAULT_VEHICLE_SETTINGS, type VehicleSettings } from "@/types/vehicle";
import {
  calculateDailyTotals,
  calculateWeeklyTotals,
  createEmptySegment,
  createShiftDay
} from "@/utils/calculations";
import { getTodayKey } from "@/utils/dates";

const EMPTY_STATE: CourierPersistedState = {
  shiftDays: [],
  vehicle: { ...DEFAULT_VEHICLE_SETTINGS },
  schemaVersion: COURIER_SCHEMA_VERSION
};

export function useCourierApp() {
  const store = useLocalStorageState<CourierPersistedState>(STORAGE_KEYS.courierApp, EMPTY_STATE);
  const [migrationDone, setMigrationDone] = useState(false);

  useEffect(() => {
    if (store.isHydrated && !migrationDone) {
      const migrated = readCourierState();
      if (migrated.shiftDays.length > 0 || store.state.shiftDays.length === 0) {
        store.setValue(migrated);
      }
      setMigrationDone(true);
    }
  }, [store.isHydrated, migrationDone, store]);

  const persist = useCallback(
    (next: CourierPersistedState) => {
      store.setValue(next);
      writeCourierState(next);
    },
    [store]
  );

  const shiftDays = store.state.shiftDays;
  const vehicle = store.state.vehicle;

  const todayKey = getTodayKey();
  const todayDay = useMemo(
    () => shiftDays.find((day) => day.date === todayKey) ?? null,
    [shiftDays, todayKey]
  );

  const todaySummary = useMemo(
    () => (todayDay && todayDay.segments.length > 0 ? calculateDailyTotals(todayDay, vehicle) : null),
    [todayDay, vehicle]
  );

  const weeklySummary = useMemo(() => calculateWeeklyTotals(shiftDays, vehicle), [shiftDays, vehicle]);

  const getDayByDate = useCallback(
    (date: string) => shiftDays.find((day) => day.date === date) ?? null,
    [shiftDays]
  );

  const saveShiftDay = useCallback(
    (day: ShiftDay) => {
      const nextDays = shiftDays.filter((d) => d.date !== day.date);
      const updated: ShiftDay = { ...day, updatedAt: new Date().toISOString() };
      persist({
        ...store.state,
        shiftDays: [updated, ...nextDays].sort((a, b) => b.date.localeCompare(a.date))
      });
    },
    [persist, shiftDays, store.state]
  );

  const ensureDay = useCallback(
    (date: string): ShiftDay => {
      const existing = getDayByDate(date);
      if (existing) return existing;
      const created = createShiftDay(date);
      persist({
        ...store.state,
        shiftDays: [created, ...shiftDays]
      });
      return created;
    },
    [getDayByDate, persist, shiftDays, store.state]
  );

  const addSegment = useCallback(
    (date: string, platform?: ShiftSegment["platform"]) => {
      const day = ensureDay(date);
      const segment = createEmptySegment(platform);
      saveShiftDay({
        ...day,
        segments: [...day.segments, segment]
      });
      return segment.id;
    },
    [ensureDay, saveShiftDay]
  );

  const updateSegment = useCallback(
    (date: string, segmentId: string, patch: Partial<ShiftSegment>) => {
      const day = getDayByDate(date);
      if (!day) return;
      saveShiftDay({
        ...day,
        segments: day.segments.map((segment) => (segment.id === segmentId ? { ...segment, ...patch } : segment))
      });
    },
    [getDayByDate, saveShiftDay]
  );

  const removeSegment = useCallback(
    (date: string, segmentId: string) => {
      const day = getDayByDate(date);
      if (!day) return;
      saveShiftDay({
        ...day,
        segments: day.segments.filter((segment) => segment.id !== segmentId)
      });
    },
    [getDayByDate, saveShiftDay]
  );

  const setVehicle = useCallback(
    (next: VehicleSettings) => {
      persist({ ...store.state, vehicle: next });
    },
    [persist, store.state]
  );

  const importShiftDays = useCallback(
    (incoming: ShiftDay[]) => {
      persist({
        ...store.state,
        shiftDays: mergeShiftDays(shiftDays, incoming)
      });
    },
    [persist, shiftDays, store.state]
  );

  const resetCourierData = useCallback(() => {
    persist(EMPTY_STATE);
  }, [persist]);

  return {
    shiftDays,
    vehicle,
    isHydrated: store.isHydrated && migrationDone,
    todayKey,
    todayDay,
    todaySummary,
    weeklySummary,
    getDayByDate,
    ensureDay,
    saveShiftDay,
    addSegment,
    updateSegment,
    removeSegment,
    setVehicle,
    importShiftDays,
    resetCourierData
  };
}
