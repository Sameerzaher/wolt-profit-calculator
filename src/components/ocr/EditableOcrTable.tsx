"use client";

import type { DeliveryTask } from "@/types/models";

type Props = {
  tasks: DeliveryTask[];
  onUpdateTask: (id: string, patch: Partial<DeliveryTask>) => void;
  onDeleteTask: (id: string) => void;
  onAddManualTask: () => void;
};

export default function EditableOcrTable({ tasks, onUpdateTask, onDeleteTask, onAddManualTask }: Props) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-200">תיקון OCR לפני חישוב</p>
        <button
          type="button"
          onClick={onAddManualTask}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-bold text-slate-200"
        >
          הוסף שורה ידנית
        </button>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-xs">
          <thead>
            <tr className="text-slate-400">
              <th className="border-b border-slate-800 p-2 text-right">restaurant</th>
              <th className="border-b border-slate-800 p-2 text-right">time</th>
              <th className="border-b border-slate-800 p-2 text-right">distance (km)</th>
              <th className="border-b border-slate-800 p-2 text-right">amount (₪)</th>
              <th className="border-b border-slate-800 p-2 text-right">deliveries count</th>
              <th className="border-b border-slate-800 p-2 text-right">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td className="border-b border-slate-900 p-2">
                  <input
                    value={task.restaurant ?? ""}
                    onChange={(e) => onUpdateTask(task.id, { restaurant: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1"
                  />
                </td>
                <td className="border-b border-slate-900 p-2">
                  <input
                    value={task.time ?? ""}
                    onChange={(e) => onUpdateTask(task.id, { time: e.target.value || undefined })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1"
                  />
                </td>
                <td className="border-b border-slate-900 p-2">
                  <input
                    value={task.distanceKm ?? ""}
                    onChange={(e) => onUpdateTask(task.id, { distanceKm: toOptionalNumber(e.target.value) })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1"
                  />
                </td>
                <td className="border-b border-slate-900 p-2">
                  <input
                    value={task.amountIls}
                    onChange={(e) => onUpdateTask(task.id, { amountIls: toNumber(e.target.value) ?? 0 })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1"
                  />
                </td>
                <td className="border-b border-slate-900 p-2">
                  <input
                    value={task.deliveriesCount}
                    onChange={(e) => {
                      const next = toNumber(e.target.value);
                      if (next !== null) onUpdateTask(task.id, { deliveriesCount: Math.max(1, Math.round(next)) });
                    }}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1"
                  />
                </td>
                <td className="border-b border-slate-900 p-2">
                  <button
                    type="button"
                    onClick={() => onDeleteTask(task.id)}
                    className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[11px] font-bold text-rose-100"
                  >
                    מחק
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function toOptionalNumber(value: string): number | undefined {
  const parsed = toNumber(value);
  if (parsed === null) return undefined;
  return parsed;
}

function toNumber(value: string): number | null {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}
