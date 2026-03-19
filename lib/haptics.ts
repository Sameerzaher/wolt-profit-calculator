/** Lightweight haptic feedback for mobile (no-op if unsupported). */
export function hapticLight(): void {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(18);
    }
  } catch {
    /* ignore */
  }
}
