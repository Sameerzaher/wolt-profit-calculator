"use client";

import ConfidenceBadge from "@/components/ocr/ConfidenceBadge";
import PlatformBadge from "@/components/courier/PlatformBadge";
import type { OcrExtractionDraft } from "@/types/ocr";
import { PLATFORMS, PLATFORM_LABELS } from "@/types/platform";
import { durationToEndTime } from "@/utils/ocr/parsers/common";

type Props = {
  draft: OcrExtractionDraft;
  onChange: (patch: Partial<OcrExtractionDraft>) => void;
  showRawText: boolean;
  onToggleRawText: () => void;
};

export default function ExtractionReviewForm({ draft, onChange, showRawText, onToggleRawText }: Props) {
  const confidenceByField = new Map(draft.fieldConfidences.map((f) => [f.field, f]));

  const onDurationChange = (hours: number) => {
    const shiftDurationHours = Math.max(0, hours);
    onChange({
      shiftDurationHours,
      endTime: durationToEndTime(draft.startTime, shiftDurationHours, draft.endsNextDay)
    });
  };

  return (
    <section className="space-y-4">
      <div className="app-card flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs text-slate-400">ביטחון כולל בזיהוי</p>
          <div className="mt-1 flex items-center gap-2">
            <PlatformBadge platform={draft.platform} />
            <ConfidenceBadge score={draft.overallConfidence} />
          </div>
        </div>
        <p className="text-[11px] text-slate-500">ערכו לפני שמירה</p>
      </div>

      <div className="app-card space-y-3">
        <label className="block text-sm font-bold text-slate-200">פלטפורמה</label>
        <div className="grid grid-cols-3 gap-2">
          {PLATFORMS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onChange({ platform: p })}
              className={`btn-pill ${draft.platform === p ? "btn-pill-active" : "btn-pill-idle"}`}
            >
              {PLATFORM_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <ReviewField
        label="תאריך"
        confidence={confidenceByField.get("date")}
        input={
          <input
            type="date"
            value={draft.date}
            onChange={(e) => onChange({ date: e.target.value })}
            className="date-input h-11 rounded-xl"
          />
        }
      />

      <ReviewField
        label="הכנסה (₪)"
        confidence={confidenceByField.get("income")}
        input={
          <input
            type="number"
            min={0}
            step={0.01}
            value={draft.income || ""}
            onChange={(e) => onChange({ income: Number(e.target.value) || 0 })}
            className="field-input"
            dir="ltr"
          />
        }
      />

      <ReviewField
        label="בונוס / טיפים (₪)"
        confidence={confidenceByField.get("bonuses")}
        input={
          <input
            type="number"
            min={0}
            step={0.01}
            value={draft.bonuses || ""}
            onChange={(e) => {
              const bonuses = Number(e.target.value) || 0;
              onChange({ bonuses });
            }}
            className="field-input"
            dir="ltr"
          />
        }
      />

      <ReviewField
        label="מספר משלוחים"
        confidence={confidenceByField.get("deliveriesCount")}
        input={
          <input
            type="number"
            min={0}
            step={1}
            value={draft.deliveriesCount}
            onChange={(e) => onChange({ deliveriesCount: Math.max(0, Number(e.target.value) || 0) })}
            className="field-input"
            dir="ltr"
          />
        }
      />

      <ReviewField
        label="משך משמרת (שעות)"
        confidence={confidenceByField.get("shiftDurationHours")}
        input={
          <input
            type="number"
            min={0}
            step={0.25}
            value={draft.shiftDurationHours || ""}
            onChange={(e) => onDurationChange(Number(e.target.value) || 0)}
            className="field-input"
            dir="ltr"
          />
        }
      />

      <div className="grid grid-cols-2 gap-3">
        <ReviewField
          label="התחלה"
          confidence={confidenceByField.get("startTime")}
          input={
            <input
              type="time"
              value={draft.startTime}
              onChange={(e) =>
                onChange({
                  startTime: e.target.value,
                  endTime: durationToEndTime(e.target.value, draft.shiftDurationHours, draft.endsNextDay)
                })
              }
              className="field-input"
              dir="ltr"
            />
          }
        />
        <ReviewField
          label="סיום"
          confidence={confidenceByField.get("endTime")}
          input={
            <input
              type="time"
              value={draft.endTime}
              onChange={(e) => onChange({ endTime: e.target.value })}
              className="field-input"
              dir="ltr"
            />
          }
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={draft.endsNextDay}
          onChange={(e) => onChange({ endsNextDay: e.target.checked })}
          className="h-4 w-4 rounded border-slate-600"
        />
        המשמרת נמשכת ליום למחרת
      </label>

      <ReviewField
        label="קילומטרים (אופציונלי)"
        confidence={confidenceByField.get("kilometers")}
        input={
          <input
            type="number"
            min={0}
            step={0.1}
            value={draft.kilometers || ""}
            onChange={(e) => onChange({ kilometers: Number(e.target.value) || 0 })}
            className="field-input"
            dir="ltr"
          />
        }
      />

      <button
        type="button"
        onClick={onToggleRawText}
        className="w-full rounded-xl border border-slate-700 py-2 text-xs font-bold text-slate-300"
      >
        {showRawText ? "הסתר טקסט OCR" : "הצג טקסט OCR גולמי"}
      </button>

      {showRawText ? (
        <pre className="max-h-48 overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-3 text-[10px] leading-relaxed text-slate-400" dir="ltr">
          {draft.rawText || "(ריק)"}
        </pre>
      ) : null}
    </section>
  );
}

function ReviewField({
  label,
  confidence,
  input
}: {
  label: string;
  confidence?: { confidence: number; hint: string };
  input: React.ReactNode;
}) {
  return (
    <div className="app-card space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-slate-200">{label}</p>
        {confidence ? <ConfidenceBadge score={confidence.confidence} /> : null}
      </div>
      {input}
      {confidence?.hint ? <p className="text-[10px] text-slate-500">{confidence.hint}</p> : null}
    </div>
  );
}
