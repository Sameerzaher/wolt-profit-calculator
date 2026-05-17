"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { BACKUP_SCHEMA_VERSION, DEFAULT_APP_SETTINGS, DEFAULT_FUEL_SETTINGS, WEEKLY_GOAL_STORAGE_KEY } from "@/lib/constants";
import { createDemoData } from "@/lib/demoData";
import { calculateHourlyRate, calculateProfit } from "@/lib/calculations";
import { calculateFuelCost, calculateQuickCheck } from "@/lib/scoring";
import { dateKey } from "@/lib/utils";
import { useAppStore } from "@/hooks/useAppStore";
import {
  useAppSettingsStorage,
  useDayShiftsStorage,
  useDeliveriesStorage,
  useFuelSettingsStorage,
  usePreferredZonesStorage,
  useShiftsStorage
} from "@/hooks/storage";
import { mergeDayRecords } from "@/src/lib/migrateDayShifts";
import { listAllDayShifts, listAllShiftAnalyses, runDayShiftsMigrationIfNeeded, saveDayShift as persistDayShift, saveShiftAnalysisByDate } from "@/lib/storage";
import type {
  AppSettings,
  AppShift,
  AppShiftBreak,
  AppShiftSession,
  DayShiftRecord,
  Delivery,
  DeliveryCompletionInput,
  FuelSettings,
  QuickCheckInput,
  ScreenshotAnalysisSnapshot
} from "@/types/models";

type AppDataContextType = {
  deliveries: Delivery[];
  shifts: AppShift[];
  dayShifts: DayShiftRecord[];
  preferredZones: string[];
  appSettings: AppSettings;
  fuelSettings: FuelSettings;
  isHydrated: boolean;
  activeDelivery: Delivery | null;
  saveDayShift: (record: DayShiftRecord) => void;
  runQuickCheck: (input: QuickCheckInput) => ReturnType<typeof calculateQuickCheck>;
  startShift: () => void;
  endShift: () => void;
  startBreak: () => void;
  endBreak: () => void;
  updateActiveShiftSnapshot: (payload: { totalIncome?: number; totalKm?: number; sessions?: AppShiftSession[] }) => void;
  updateActiveShiftExpenses: (payload: { actualDrivenKm?: number; costPerKm?: number }) => void;
  updateActiveShiftSessions: (sessions: AppShiftSession[]) => void;
  acceptQuickCheck: (input: QuickCheckInput) => void;
  addManualCompletedDelivery: (input: QuickCheckInput, completion: DeliveryCompletionInput) => void;
  markPickedUp: () => void;
  markDelivered: () => void;
  completeActiveDelivery: (payload: DeliveryCompletionInput) => void;
  updateFuelSettings: (next: FuelSettings) => void;
  updateAppSettings: (next: AppSettings) => void;
  updatePreferredZones: (zones: string[]) => void;
  seedDemoData: () => void;
  exportData: () => void;
  importBackup: (jsonText: string) => { ok: true } | { ok: false; error: string };
  resetData: () => void;
};

const AppDataContext = createContext<AppDataContextType | null>(null);

function ensureTodayShift(shifts: AppShift[]): AppShift {
  const today = dateKey(new Date().toISOString());
  const existing = shifts.find((shift) => shift.dateKey === today);
  if (existing) return existing;
  return {
    id: crypto.randomUUID(),
    dateKey: today,
    startedAt: new Date().toISOString(),
    startTime: new Date().toISOString(),
    deliveryIds: [],
    idleTimeEstimateMinutes: 0,
    totalKm: 0,
    totalIncome: 0,
    breaks: [],
    sessions: []
  };
}

function getCurrentShift(shifts: AppShift[], activeShiftId: string | null): AppShift {
  if (activeShiftId) {
    const byId = shifts.find((shift) => shift.id === activeShiftId);
    if (byId) return byId;
  }
  const openShift = shifts.find((shift) => !shift.endedAt);
  if (openShift) return openShift;
  return ensureTodayShift(shifts);
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const deliveriesStore = useDeliveriesStorage();
  const shiftsStore = useShiftsStorage();
  const dayShiftsStore = useDayShiftsStorage();
  const preferredZonesStore = usePreferredZonesStorage();
  const appSettingsStore = useAppSettingsStorage();
  const fuelSettingsStore = useFuelSettingsStorage();

  const storesHydrated =
    deliveriesStore.isHydrated &&
    shiftsStore.isHydrated &&
    dayShiftsStore.isHydrated &&
    preferredZonesStore.isHydrated &&
    appSettingsStore.isHydrated &&
    fuelSettingsStore.isHydrated;

  const [hydrationFallback, setHydrationFallback] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setHydrationFallback(true), 1500);
    return () => window.clearTimeout(timer);
  }, []);

  const isHydrated = storesHydrated || hydrationFallback;
  const setCurrentShiftId = useAppStore((state) => state.setCurrentShiftId);
  const setCostPerKm = useAppStore((state) => state.setCostPerKm);

  useEffect(() => {
    setCurrentShiftId(appSettingsStore.state.activeShiftId);
  }, [appSettingsStore.state.activeShiftId, setCurrentShiftId]);

  useEffect(() => {
    setCostPerKm(fuelSettingsStore.state.costPerKm);
  }, [fuelSettingsStore.state.costPerKm, setCostPerKm]);

  useEffect(() => {
    if (!isHydrated) return;
    runDayShiftsMigrationIfNeeded();
    const migrated = listAllDayShifts();
    if (migrated.length > 0 && dayShiftsStore.state.length === 0) {
      dayShiftsStore.setValue(migrated);
    } else if (migrated.length > dayShiftsStore.state.length) {
      dayShiftsStore.setValue(mergeDayRecords(dayShiftsStore.state, migrated));
    }
  }, [isHydrated]);

  const saveDayShift = (record: DayShiftRecord) => {
    persistDayShift(record);
    dayShiftsStore.setValue((current) => {
      const next = current.filter((item) => item.shiftDate !== record.shiftDate);
      return [record, ...next].sort((a, b) => b.shiftDate.localeCompare(a.shiftDate));
    });
  };

  const activeDelivery =
    deliveriesStore.state.find((delivery) => delivery.id === appSettingsStore.state.activeDeliveryId) ?? null;

  const runQuickCheck = (input: QuickCheckInput) =>
    calculateQuickCheck(input, fuelSettingsStore.state, preferredZonesStore.state);

  const startShift = () => {
    const openShift = shiftsStore.state.find((shift) => !shift.endedAt);
    if (openShift) {
      appSettingsStore.setValue({ ...appSettingsStore.state, activeShiftId: openShift.id });
      setCurrentShiftId(openShift.id);
      return;
    }
    const shift: AppShift = {
      id: crypto.randomUUID(),
      dateKey: dateKey(new Date().toISOString()),
      startedAt: new Date().toISOString(),
      startTime: new Date().toISOString(),
      deliveryIds: [],
      idleTimeEstimateMinutes: 0,
      totalKm: 0,
      totalIncome: 0,
      breaks: [],
      sessions: []
    };
    shiftsStore.setValue([shift, ...shiftsStore.state]);
    appSettingsStore.setValue({ ...appSettingsStore.state, activeShiftId: shift.id });
    setCurrentShiftId(shift.id);
  };

  const endShift = () => {
    const current = getCurrentShift(shiftsStore.state, appSettingsStore.state.activeShiftId);
    shiftsStore.setValue(
      shiftsStore.state.map((shift) =>
        shift.id === current.id ? { ...shift, endedAt: new Date().toISOString(), endTime: new Date().toISOString() } : shift
      )
    );
    appSettingsStore.setValue({ ...appSettingsStore.state, activeShiftId: null, activeDeliveryId: null });
    setCurrentShiftId(null);
  };

  const startBreak = () => {
    const current = getCurrentShift(shiftsStore.state, appSettingsStore.state.activeShiftId);
    const hasCurrent = shiftsStore.state.some((shift) => shift.id === current.id);
    const lastBreak = current.breaks?.[current.breaks.length - 1];
    if (lastBreak && !lastBreak.end) return;
    const nextBreak: AppShiftBreak = { id: crypto.randomUUID(), start: new Date().toISOString() };
    const nextBreaks = [...(current.breaks ?? []), nextBreak];

    if (!hasCurrent) {
      shiftsStore.setValue([{ ...current, breaks: nextBreaks }, ...shiftsStore.state]);
      appSettingsStore.setValue({ ...appSettingsStore.state, activeShiftId: current.id });
      setCurrentShiftId(current.id);
      return;
    }

    shiftsStore.setValue(shiftsStore.state.map((shift) => (shift.id === current.id ? { ...shift, breaks: nextBreaks } : shift)));
  };

  const endBreak = () => {
    const current = getCurrentShift(shiftsStore.state, appSettingsStore.state.activeShiftId);
    const hasCurrent = shiftsStore.state.some((shift) => shift.id === current.id);
    const breaks = [...(current.breaks ?? [])];
    const lastIndex = breaks.length - 1;
    if (lastIndex < 0) return;
    if (breaks[lastIndex].end) return;
    breaks[lastIndex] = { ...breaks[lastIndex], end: new Date().toISOString() };

    if (!hasCurrent) {
      shiftsStore.setValue([{ ...current, breaks }, ...shiftsStore.state]);
      appSettingsStore.setValue({ ...appSettingsStore.state, activeShiftId: current.id });
      setCurrentShiftId(current.id);
      return;
    }

    shiftsStore.setValue(shiftsStore.state.map((shift) => (shift.id === current.id ? { ...shift, breaks } : shift)));
  };

  const updateActiveShiftExpenses = (payload: { actualDrivenKm?: number; costPerKm?: number }) => {
    const current = getCurrentShift(shiftsStore.state, appSettingsStore.state.activeShiftId);
    const hasCurrent = shiftsStore.state.some((shift) => shift.id === current.id);
    if (!hasCurrent) {
      shiftsStore.setValue([
        {
          ...current,
          actualDrivenKm: payload.actualDrivenKm,
          costPerKm: payload.costPerKm,
          totalKm: payload.actualDrivenKm
        },
        ...shiftsStore.state
      ]);
      appSettingsStore.setValue({ ...appSettingsStore.state, activeShiftId: current.id });
      setCurrentShiftId(current.id);
      return;
    }
    shiftsStore.setValue(
      shiftsStore.state.map((shift) =>
        shift.id === current.id
          ? {
              ...shift,
              actualDrivenKm: payload.actualDrivenKm,
              costPerKm: payload.costPerKm,
              totalKm: payload.actualDrivenKm
            }
          : shift
      )
    );
  };

  const updateActiveShiftSnapshot = (payload: { totalIncome?: number; totalKm?: number; sessions?: AppShiftSession[] }) => {
    const current = getCurrentShift(shiftsStore.state, appSettingsStore.state.activeShiftId);
    const hasCurrent = shiftsStore.state.some((shift) => shift.id === current.id);
    const nextShift: AppShift = {
      ...current,
      ...(payload.totalIncome !== undefined ? { totalIncome: payload.totalIncome } : {}),
      ...(payload.totalKm !== undefined ? { totalKm: payload.totalKm, actualDrivenKm: payload.totalKm } : {}),
      ...(payload.sessions ? { sessions: payload.sessions } : {})
    };

    if (!hasCurrent) {
      shiftsStore.setValue([nextShift, ...shiftsStore.state]);
      appSettingsStore.setValue({ ...appSettingsStore.state, activeShiftId: current.id });
      setCurrentShiftId(current.id);
      return;
    }

    shiftsStore.setValue(shiftsStore.state.map((shift) => (shift.id === current.id ? nextShift : shift)));
  };

  const updateActiveShiftSessions = (sessions: AppShiftSession[]) => {
    const current = getCurrentShift(shiftsStore.state, appSettingsStore.state.activeShiftId);
    const hasCurrent = shiftsStore.state.some((shift) => shift.id === current.id);
    if (!hasCurrent) {
      shiftsStore.setValue([{ ...current, sessions }, ...shiftsStore.state]);
      appSettingsStore.setValue({ ...appSettingsStore.state, activeShiftId: current.id });
      setCurrentShiftId(current.id);
      return;
    }
    shiftsStore.setValue(
      shiftsStore.state.map((shift) => (shift.id === current.id ? { ...shift, sessions } : shift))
    );
  };

  const acceptQuickCheck = (input: QuickCheckInput) => {
    const quickCheckResult = runQuickCheck(input);
    const shift = getCurrentShift(shiftsStore.state, appSettingsStore.state.activeShiftId);
    const nextShiftState = shiftsStore.state.some((s) => s.id === shift.id)
      ? shiftsStore.state
      : [...shiftsStore.state, shift];

    const deliveryId = crypto.randomUUID();
    const newDelivery: Delivery = {
      id: deliveryId,
      shiftId: shift.id,
      status: "active",
      acceptedAt: new Date().toISOString(),
      ...input,
      quickCheckResult,
      estimatedFuelCost: calculateFuelCost(input.estimatedKm, fuelSettingsStore.state)
    };

    deliveriesStore.setValue((current) => [newDelivery, ...current]);
    shiftsStore.setValue(
      nextShiftState.map((entry) =>
        entry.id === shift.id ? { ...entry, deliveryIds: [deliveryId, ...entry.deliveryIds] } : entry
      )
    );
    appSettingsStore.setValue({ ...appSettingsStore.state, activeDeliveryId: deliveryId });
    setCurrentShiftId(shift.id);
  };

  const addManualCompletedDelivery = (input: QuickCheckInput, completion: DeliveryCompletionInput) => {
    const shift = getCurrentShift(shiftsStore.state, appSettingsStore.state.activeShiftId);
    const quickCheckResult = runQuickCheck(input);
    const fuelCost = calculateFuelCost(completion.actualKm, fuelSettingsStore.state);
    const finalNetProfit = calculateProfit(completion.actualAmount + completion.tipCash, fuelCost);
    const finalIlsPerHour = calculateHourlyRate(finalNetProfit, completion.actualMinutes / 60);
    const deliveryId = crypto.randomUUID();
    const completedDelivery: Delivery = {
      id: deliveryId,
      shiftId: shift.id,
      status: "completed",
      acceptedAt: new Date().toISOString(),
      deliveredAt: new Date().toISOString(),
      ...input,
      quickCheckResult,
      completion,
      estimatedFuelCost: fuelCost,
      finalNetProfit,
      finalIlsPerHour
    };
    deliveriesStore.setValue((current) => [completedDelivery, ...current]);
    if (!shiftsStore.state.some((entry) => entry.id === shift.id)) {
      shiftsStore.setValue([
        { ...shift, deliveryIds: [deliveryId], totalIncome: completion.actualAmount + completion.tipCash },
        ...shiftsStore.state
      ]);
    } else {
      shiftsStore.setValue(
        shiftsStore.state.map((entry) =>
          entry.id === shift.id
            ? {
                ...entry,
                deliveryIds: [deliveryId, ...entry.deliveryIds],
                totalIncome: (entry.totalIncome ?? 0) + completion.actualAmount + completion.tipCash
              }
            : entry
        )
      );
    }
  };

  const markPickedUp = () => {
    if (!activeDelivery) return;
    deliveriesStore.setValue((current) =>
      current.map((delivery) =>
        delivery.id === activeDelivery.id ? { ...delivery, pickedUpAt: new Date().toISOString() } : delivery
      )
    );
  };

  const markDelivered = () => {
    if (!activeDelivery) return;
    deliveriesStore.setValue((current) =>
      current.map((delivery) =>
        delivery.id === activeDelivery.id ? { ...delivery, deliveredAt: new Date().toISOString() } : delivery
      )
    );
  };

  const completeActiveDelivery = (payload: DeliveryCompletionInput) => {
    if (!activeDelivery) return;
    const fuelCost = calculateFuelCost(payload.actualKm, fuelSettingsStore.state);
    const finalNetProfit = calculateProfit(payload.actualAmount + payload.tipCash, fuelCost);
    const finalIlsPerHour = calculateHourlyRate(finalNetProfit, payload.actualMinutes / 60);

    deliveriesStore.setValue((current) =>
      current.map((delivery) =>
        delivery.id === activeDelivery.id
          ? {
              ...delivery,
              status: "completed",
              deliveredAt: delivery.deliveredAt ?? new Date().toISOString(),
              completion: payload,
              estimatedFuelCost: fuelCost,
              finalNetProfit,
              finalIlsPerHour
            }
          : delivery
      )
    );
    shiftsStore.setValue(
      shiftsStore.state.map((shift) =>
        shift.id === activeDelivery.shiftId
          ? { ...shift, totalIncome: (shift.totalIncome ?? 0) + payload.actualAmount + payload.tipCash }
          : shift
      )
    );
    appSettingsStore.setValue({ ...appSettingsStore.state, activeDeliveryId: null });
  };

  const seedDemoData = () => {
    const demo = createDemoData(fuelSettingsStore.state);
    deliveriesStore.setValue(demo.deliveries);
    shiftsStore.setValue(demo.shifts);
    appSettingsStore.setValue({ ...appSettingsStore.state, demoMode: true, onboardingDone: true, activeDeliveryId: null });
    setCurrentShiftId(null);
  };

  const exportData = () => {
    let weeklyGoalIls: string | undefined;
    try {
      const raw = localStorage.getItem(WEEKLY_GOAL_STORAGE_KEY);
      if (raw) weeklyGoalIls = raw;
    } catch {
      /* ignore */
    }
    const payload = {
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      deliveries: deliveriesStore.state,
      shifts: shiftsStore.state,
      preferredZones: preferredZonesStore.state,
      appSettings: appSettingsStore.state,
      fuelSettings: fuelSettingsStore.state,
      shiftAnalyses: listAllShiftAnalyses(),
      dayShifts: listAllDayShifts(),
      ...(weeklyGoalIls ? { weeklyGoalIls } : {})
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `woltcalc-v2-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = (jsonText: string): { ok: true } | { ok: false; error: string } => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return { ok: false, error: "הקובץ אינו JSON תקין." };
    }
    if (!parsed || typeof parsed !== "object") {
      return { ok: false, error: "מבנה הקובץ לא מזוהה." };
    }
    const o = parsed as Record<string, unknown>;
    if (!Array.isArray(o.deliveries)) {
      return { ok: false, error: "בקובץ חסר מערך משלוחים (פורמט גיבוי ישן או קובץ שגוי)." };
    }
    if (!Array.isArray(o.shifts)) {
      return { ok: false, error: "בקובץ חסר מערך משמרות." };
    }
    const preferred = Array.isArray(o.preferredZones) ? (o.preferredZones as string[]) : [];
    const appSettingsNext =
      typeof o.appSettings === "object" && o.appSettings !== null
        ? { ...DEFAULT_APP_SETTINGS, ...(o.appSettings as AppSettings) }
        : DEFAULT_APP_SETTINGS;
    const fuelNext =
      typeof o.fuelSettings === "object" && o.fuelSettings !== null
        ? { ...DEFAULT_FUEL_SETTINGS, ...(o.fuelSettings as FuelSettings) }
        : DEFAULT_FUEL_SETTINGS;
    try {
      deliveriesStore.setValue(o.deliveries as Delivery[]);
      shiftsStore.setValue(o.shifts as AppShift[]);
      preferredZonesStore.setValue(preferred);
      appSettingsStore.setValue(appSettingsNext);
      fuelSettingsStore.setValue(fuelNext);
    } catch {
      return { ok: false, error: "שגיאה בשכתוב הנתונים לאחסון." };
    }
    if (Array.isArray(o.shiftAnalyses)) {
      for (const item of o.shiftAnalyses) {
        if (item && typeof item === "object" && "shiftDate" in item && "analysis" in item) {
          try {
            saveShiftAnalysisByDate(item as ScreenshotAnalysisSnapshot);
          } catch {
            /* skip one bad snapshot */
          }
        }
      }
    }
    if (Array.isArray(o.dayShifts)) {
      const imported = o.dayShifts as DayShiftRecord[];
      const merged = mergeDayRecords(dayShiftsStore.state, imported);
      dayShiftsStore.setValue(merged);
      for (const record of merged) {
        persistDayShift(record);
      }
    }
    if (typeof o.weeklyGoalIls === "string" && o.weeklyGoalIls.trim()) {
      try {
        localStorage.setItem(WEEKLY_GOAL_STORAGE_KEY, o.weeklyGoalIls.trim());
      } catch {
        /* ignore */
      }
    }
    return { ok: true };
  };

  const resetData = () => {
    deliveriesStore.setValue([]);
    shiftsStore.setValue([]);
    dayShiftsStore.setValue([]);
    preferredZonesStore.setValue([]);
    appSettingsStore.setValue(DEFAULT_APP_SETTINGS);
    fuelSettingsStore.setValue(DEFAULT_FUEL_SETTINGS);
    setCurrentShiftId(null);
    setCostPerKm(DEFAULT_FUEL_SETTINGS.costPerKm);
  };

  const value: AppDataContextType = {
    deliveries: deliveriesStore.state,
    shifts: shiftsStore.state,
    dayShifts: dayShiftsStore.state,
    preferredZones: preferredZonesStore.state,
    saveDayShift,
    appSettings: appSettingsStore.state,
    fuelSettings: fuelSettingsStore.state,
    isHydrated,
    activeDelivery,
    runQuickCheck,
    startShift,
    endShift,
    startBreak,
    endBreak,
    updateActiveShiftExpenses,
    updateActiveShiftSnapshot,
    updateActiveShiftSessions,
    acceptQuickCheck,
    addManualCompletedDelivery,
    markPickedUp,
    markDelivered,
    completeActiveDelivery,
    updateFuelSettings: (next) => {
      fuelSettingsStore.setValue(next);
      setCostPerKm(next.costPerKm);
    },
    updateAppSettings: appSettingsStore.setValue,
    updatePreferredZones: preferredZonesStore.setValue,
    seedDemoData,
    exportData,
    importBackup,
    resetData
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used inside AppDataProvider");
  }
  return context;
}
