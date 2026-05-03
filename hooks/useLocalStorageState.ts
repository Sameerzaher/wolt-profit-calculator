"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useLocalStorageState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);
  const initialRef = useRef(initialValue);
  initialRef.current = initialValue;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        setState(JSON.parse(raw) as T);
      }
    } catch {
      setState(initialRef.current);
    } finally {
      setIsHydrated(true);
    }
  }, [key]);

  const setValue = useCallback(
    (value: T | ((current: T) => T)) => {
      setState((current) => {
        const nextValue = value instanceof Function ? value(current) : value;
        try {
          localStorage.setItem(key, JSON.stringify(nextValue));
        } catch {
          // Ignore storage write errors on constrained devices.
        }
        return nextValue;
      });
    },
    [key]
  );

  return { state, setValue, isHydrated };
}
