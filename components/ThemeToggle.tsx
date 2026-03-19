"use client";

type ThemeToggleProps = {
  isDark: boolean;
  onToggle: () => void;
};

export default function ThemeToggle({ isDark, onToggle }: ThemeToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="rounded-xl border border-border bg-card px-4 py-3 text-base font-semibold text-text transition hover:opacity-90 active:scale-[0.98]"
    >
      {isDark ? "מצב בהיר" : "מצב כהה"}
    </button>
  );
}
