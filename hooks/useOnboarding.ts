"use client";

import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEYS } from "@/lib/constants";

export function useOnboarding() {
  const [done, setDone] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setDone(localStorage.getItem(STORAGE_KEYS.courierOnboarding) === "1");
    } catch {
      setDone(false);
    }
    setReady(true);
  }, []);

  const complete = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.courierOnboarding, "1");
    } catch {
      /* ignore */
    }
    setDone(true);
  }, []);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.courierOnboarding);
    } catch {
      /* ignore */
    }
    setDone(false);
  }, []);

  return { done, ready, complete, reset, show: ready && !done };
}
