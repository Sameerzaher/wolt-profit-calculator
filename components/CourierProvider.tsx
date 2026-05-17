"use client";

import { createContext, useContext } from "react";
import { useCourierApp } from "@/hooks/useCourierApp";

type CourierContextValue = ReturnType<typeof useCourierApp>;

const CourierContext = createContext<CourierContextValue | null>(null);

export function CourierProvider({ children }: { children: React.ReactNode }) {
  const value = useCourierApp();
  return <CourierContext.Provider value={value}>{children}</CourierContext.Provider>;
}

export function useCourier() {
  const ctx = useContext(CourierContext);
  if (!ctx) throw new Error("useCourier must be used within CourierProvider");
  return ctx;
}
