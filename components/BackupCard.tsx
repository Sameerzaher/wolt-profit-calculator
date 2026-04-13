"use client";

type BackupCardProps = {
  onExport: () => void;
  onImport: (file: File) => void;
};

export default function BackupCard({ onExport, onImport }: BackupCardProps) {
  return (
    <section className="card-panel ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
      <h2 className="text-lg font-bold text-text">גיבוי</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        ייצוא או ייבוא של הבדיקות השמורות כקובץ JSON מקומי.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onExport}
          className="min-h-[2.75rem] rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:border-muted active:scale-[0.98] dark:bg-card/80"
        >
          ייצוא
        </button>
        <label className="inline-flex min-h-[2.75rem] cursor-pointer items-center rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:border-muted active:scale-[0.98] dark:bg-card/80">
          ייבוא
          <input
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImport(file);
              e.currentTarget.value = "";
            }}
          />
        </label>
      </div>
    </section>
  );
}
