"use client";

type BackupCardProps = {
  onExport: () => void;
  onImport: (file: File) => void;
};

export default function BackupCard({ onExport, onImport }: BackupCardProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <h2 className="text-lg font-bold">גיבוי ושחזור</h2>
      <p className="mt-2 text-sm text-muted">ייצוא/ייבוא של היסטוריה והגדרות בקובץ JSON מקומי.</p>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={onExport}
          className="rounded-lg border border-border px-3 py-2 text-sm transition hover:text-text"
        >
          ייצוא גיבוי
        </button>
        <label className="rounded-lg border border-border px-3 py-2 text-sm transition hover:text-text">
          ייבוא גיבוי
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
