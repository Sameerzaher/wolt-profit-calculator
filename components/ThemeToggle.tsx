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
      className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold uppercase tracking-wide text-text shadow-sm transition hover:bg-accent/40 active:scale-[0.98] dark:bg-card/90 dark:hover:bg-white/5 sm:w-auto sm:min-w-[5.5rem] sm:text-base sm:normal-case sm:tracking-normal"
    >
      {isDark ? "מצב בהיר" : "מצב כהה"}
    </button>
  );
}
