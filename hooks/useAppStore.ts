"use client";

import { create } from "zustand";

type AppGlobalState = {
  currentShiftId: string | null;
  settings: {
    costPerKm: number;
  };
  setCurrentShiftId: (currentShiftId: string | null) => void;
  setCostPerKm: (costPerKm: number) => void;
};

export const useAppStore = create<AppGlobalState>((set) => ({
  currentShiftId: null,
  settings: {
    costPerKm: 0
  },
  setCurrentShiftId: (currentShiftId) => set({ currentShiftId }),
  setCostPerKm: (costPerKm) =>
    set((state) => ({
      settings: {
        ...state.settings,
        costPerKm
      }
    }))
}));
