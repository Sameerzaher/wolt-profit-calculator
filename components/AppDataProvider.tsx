"use client";

import { createContext, useContext } from "react";
import { DEFAULT_APP_SETTINGS, DEFAULT_FUEL_SETTINGS } from "@/lib/constants";
import { createDemoData } from "@/lib/demoData";
import { calculateFuelCost, calculateQuickCheck } from "@/lib/scoring";
import { dateKey } from "@/lib/utils";
import {
  useAppSettingsStorage,
  useDeliveriesStorage,
  useFuelSettingsStorage,
  usePreferredZonesStorage,
  useShiftsStorage
} from "@/hooks/storage";
import type { AppSettings, Delivery, DeliveryCompletionInput, FuelSettings, QuickCheckInput, Shift } from "@/types/models";

type AppDataContextType = {
  deliveries: Delivery[];
  shifts: Shift[];
  preferredZones: string[];
  appSettings: AppSettings;
  fuelSettings: FuelSettings;
  isHydrated: boolean;
  activeDelivery: Delivery | null;
  runQuickCheck: (input: QuickCheckInput) => ReturnType<typeof calculateQuickCheck>;
  startShift: () => void;
  endShift: () => void;
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
  resetData: () => void;
};

const AppDataContext = createContext<AppDataContextType | null>(null);

function ensureTodayShift(shifts: Shift[]): Shift {
  const today = dateKey(new Date().toISOString());
  const existing = shifts.find((shift) => shift.dateKey === today);
  if (existing) return existing;
  return {
    id: crypto.randomUUID(),
    dateKey: today,
    startedAt: new Date().toISOString(),
    deliveryIds: [],
    idleTimeEstimateMinutes: 0
  };
}

function getCurrentShift(shifts: Shift[], activeShiftId: string | null): Shift {
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
  const preferredZonesStore = usePreferredZonesStorage();
  const appSettingsStore = useAppSettingsStorage();
  const fuelSettingsStore = useFuelSettingsStorage();

  const isHydrated =
    deliveriesStore.isHydrated &&
    shiftsStore.isHydrated &&
    preferredZonesStore.isHydrated &&
    appSettingsStore.isHydrated &&
    fuelSettingsStore.isHydrated;

  const activeDelivery =
    deliveriesStore.state.find((delivery) => delivery.id === appSettingsStore.state.activeDeliveryId) ?? null;

  const runQuickCheck = (input: QuickCheckInput) =>
    calculateQuickCheck(input, fuelSettingsStore.state, preferredZonesStore.state);

  const startShift = () => {
    const openShift = shiftsStore.state.find((shift) => !shift.endedAt);
    if (openShift) {
      appSettingsStore.setValue({ ...appSettingsStore.state, activeShiftId: openShift.id });
      return;
    }
    const shift: Shift = {
      id: crypto.randomUUID(),
      dateKey: dateKey(new Date().toISOString()),
      startedAt: new Date().toISOString(),
      deliveryIds: [],
      idleTimeEstimateMinutes: 0
    };
    shiftsStore.setValue([shift, ...shiftsStore.state]);
    appSettingsStore.setValue({ ...appSettingsStore.state, activeShiftId: shift.id });
  };

  const endShift = () => {
    const current = getCurrentShift(shiftsStore.state, appSettingsStore.state.activeShiftId);
    shiftsStore.setValue(
      shiftsStore.state.map((shift) => (shift.id === current.id ? { ...shift, endedAt: new Date().toISOString() } : shift))
    );
    appSettingsStore.setValue({ ...appSettingsStore.state, activeShiftId: null, activeDeliveryId: null });
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
  };

  const addManualCompletedDelivery = (input: QuickCheckInput, completion: DeliveryCompletionInput) => {
    const shift = getCurrentShift(shiftsStore.state, appSettingsStore.state.activeShiftId);
    const quickCheckResult = runQuickCheck(input);
    const fuelCost = calculateFuelCost(completion.actualKm, fuelSettingsStore.state);
    const finalNetProfit = completion.actualAmount + completion.tipCash - fuelCost;
    const finalIlsPerHour = completion.actualMinutes > 0 ? finalNetProfit / (completion.actualMinutes / 60) : 0;
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
      shiftsStore.setValue([{ ...shift, deliveryIds: [deliveryId] }, ...shiftsStore.state]);
    } else {
      shiftsStore.setValue(
        shiftsStore.state.map((entry) =>
          entry.id === shift.id ? { ...entry, deliveryIds: [deliveryId, ...entry.deliveryIds] } : entry
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
    const finalNetProfit = payload.actualAmount + payload.tipCash - fuelCost;
    const finalIlsPerHour = payload.actualMinutes > 0 ? finalNetProfit / (payload.actualMinutes / 60) : 0;

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
    appSettingsStore.setValue({ ...appSettingsStore.state, activeDeliveryId: null });
  };

  const seedDemoData = () => {
    const demo = createDemoData(fuelSettingsStore.state);
    deliveriesStore.setValue(demo.deliveries);
    shiftsStore.setValue(demo.shifts);
    appSettingsStore.setValue({ ...appSettingsStore.state, demoMode: true, onboardingDone: true, activeDeliveryId: null });
  };

  const exportData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      deliveries: deliveriesStore.state,
      shifts: shiftsStore.state,
      preferredZones: preferredZonesStore.state,
      appSettings: appSettingsStore.state,
      fuelSettings: fuelSettingsStore.state
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `woltcalc-v2-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const resetData = () => {
    deliveriesStore.setValue([]);
    shiftsStore.setValue([]);
    preferredZonesStore.setValue([]);
    appSettingsStore.setValue(DEFAULT_APP_SETTINGS);
    fuelSettingsStore.setValue(DEFAULT_FUEL_SETTINGS);
  };

  const value: AppDataContextType = {
    deliveries: deliveriesStore.state,
    shifts: shiftsStore.state,
    preferredZones: preferredZonesStore.state,
    appSettings: appSettingsStore.state,
    fuelSettings: fuelSettingsStore.state,
    isHydrated,
    activeDelivery,
    runQuickCheck,
    startShift,
    endShift,
    acceptQuickCheck,
    addManualCompletedDelivery,
    markPickedUp,
    markDelivered,
    completeActiveDelivery,
    updateFuelSettings: fuelSettingsStore.setValue,
    updateAppSettings: appSettingsStore.setValue,
    updatePreferredZones: preferredZonesStore.setValue,
    seedDemoData,
    exportData,
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
