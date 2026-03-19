"use client";

import type { ChangeEvent, KeyboardEvent, Ref } from "react";
import { useEffect, useRef, useState } from "react";
import type { CalculatorInput, NextOrderChance } from "@/lib/types";
import { parseIntLoose, parseMoney, validateCalculatorInput } from "@/lib/inputValidation";

type CalculatorFormProps = {
  value: CalculatorInput;
  onChange: (next: CalculatorInput) => void;
  onValidityChange: (issues: string[]) => void;
  mode: "quick" | "advanced";
};

const chanceOptions: { value: NextOrderChance; label: string }[] = [
  { value: "high", label: "גבוה" },
  { value: "medium", label: "בינוני" },
  { value: "low", label: "נמוך" }
];

const presets = [
  { label: "צהריים", isPeakHour: true, nextOrderChance: "high" as NextOrderChance },
  { label: "ערב", isPeakHour: true, nextOrderChance: "medium" as NextOrderChance },
  { label: "סופ״ש", isPeakHour: true, nextOrderChance: "high" as NextOrderChance }
];

function clampPayout(n: number): number {
  return Math.min(2000, Math.max(0, n));
}

function clampMinutes(n: number): number {
  return Math.min(400, Math.max(1, Math.round(n)));
}

function clampKm(n: number): number {
  return Math.min(150, Math.max(0.1, Math.round(n * 10) / 10));
}

type Triplet = { p: string; m: string; k: string };

function tryCommit(t: Triplet, rest: CalculatorInput): { ok: true; next: CalculatorInput } | { ok: false; issues: string[] } {
  const payout = parseMoney(t.p);
  const minutesRaw = parseIntLoose(t.m);
  const km = parseMoney(t.k);

  if (payout === null || km === null || minutesRaw === null) {
    const partial: CalculatorInput = {
      ...rest,
      payout: payout ?? -1,
      minutes: minutesRaw !== null ? minutesRaw : 0,
      km: km ?? -1
    };
    const v = validateCalculatorInput(partial);
    return {
      ok: false,
      issues: v.length ? v : ["מלא את כל השדות (תשלום, דקות, ק״מ)."]
    };
  }

  const next: CalculatorInput = {
    ...rest,
    payout: clampPayout(payout),
    minutes: clampMinutes(minutesRaw),
    km: clampKm(km)
  };

  const issues = validateCalculatorInput(next);
  if (issues.length) return { ok: false, issues };
  return { ok: true, next };
}

function FieldRow({
  label,
  inputId,
  inputRef,
  fieldValue,
  onValueChange,
  onKeyDown,
  inputMode,
  onMinus,
  onPlus,
  onPlusExtra
}: {
  label: string;
  inputId: string;
  inputRef: Ref<HTMLInputElement>;
  fieldValue: string;
  onValueChange: (value: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  inputMode: "numeric" | "decimal";
  onMinus: () => void;
  onPlus: () => void;
  onPlusExtra?: () => void;
}) {
  return (
    <div>
      <label className="label-base" htmlFor={inputId}>
        {label}
      </label>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          inputMode={inputMode}
          autoComplete="off"
          enterKeyHint="next"
          className="input-base min-w-0 flex-1 font-semibold tabular-nums"
          value={fieldValue}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <div className="flex shrink-0 flex-col justify-center">
          <div className="flex gap-1">
            <button type="button" className="step-btn" onClick={onMinus} aria-label="הפחת">
              −
            </button>
            <button type="button" className="step-btn" onClick={onPlus} aria-label="הוסף">
              +
            </button>
            {onPlusExtra && (
              <button type="button" className="step-btn min-w-[2.75rem] px-2 text-sm" onClick={onPlusExtra} aria-label="הוסף 10">
                +10
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CalculatorForm({ value, onChange, onValidityChange, mode }: CalculatorFormProps) {
  const [text, setText] = useState<Triplet>({
    p: String(value.payout),
    m: String(value.minutes),
    k: String(value.km)
  });

  const payoutRef = useRef<HTMLInputElement>(null);
  const minutesRef = useRef<HTMLInputElement>(null);
  const kmRef = useRef<HTMLInputElement>(null);

  const syncKey = `${value.payout}|${value.minutes}|${value.km}|${value.isPeakHour}|${value.inHotZone}|${value.nextOrderChance}`;
  const lastSync = useRef("");

  useEffect(() => {
    if (syncKey !== lastSync.current) {
      lastSync.current = syncKey;
      setText({ p: String(value.payout), m: String(value.minutes), k: String(value.km) });
    }
  }, [syncKey, value.payout, value.minutes, value.km, value.isPeakHour, value.inHotZone, value.nextOrderChance]);

  useEffect(() => {
    const t = window.setTimeout(() => payoutRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, []);

  const emit = (nextText: Triplet) => {
    const res = tryCommit(nextText, value);
    if (res.ok) {
      onValidityChange([]);
      onChange(res.next);
    } else {
      onValidityChange(res.issues);
    }
  };

  const focusNext = (current: "payout" | "minutes" | "km") => {
    if (current === "payout") minutesRef.current?.focus();
    else if (current === "minutes") kmRef.current?.focus();
    else payoutRef.current?.focus();
  };

  const bumpField = (field: "p" | "m" | "k", delta: number) => {
    const cur = tryCommit(text, value);
    const base = cur.ok ? cur.next : value;
    let p = base.payout;
    let m = base.minutes;
    let km = base.km;
    if (field === "p") p = clampPayout(p + delta);
    if (field === "m") m = clampMinutes(m + delta);
    if (field === "k") km = clampKm(km + delta);
    const nextText: Triplet = { p: String(p), m: String(m), k: String(km) };
    setText(nextText);
    emit(nextText);
  };

  const setBool = (key: "isPeakHour" | "inHotZone") => (e: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, [key]: e.target.checked });
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">מחשבון משלוח</h2>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        {presets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() =>
              onChange({
                ...value,
                isPeakHour: preset.isPeakHour,
                nextOrderChance: preset.nextOrderChance
              })
            }
            className="rounded-xl border border-border px-3 py-2 text-sm font-medium transition active:scale-[0.98]"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="space-y-5">
        <FieldRow
          label="תשלום (₪)"
          inputId="payout"
          inputRef={payoutRef}
          fieldValue={text.p}
          inputMode="numeric"
          onValueChange={(v) => {
            const next = { ...text, p: v };
            setText(next);
            emit(next);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              focusNext("payout");
            }
          }}
          onMinus={() => bumpField("p", -5)}
          onPlus={() => bumpField("p", 5)}
          onPlusExtra={() => bumpField("p", 10)}
        />

        <FieldRow
          label="זמן משוער (דקות)"
          inputId="minutes"
          inputRef={minutesRef}
          fieldValue={text.m}
          inputMode="numeric"
          onValueChange={(v) => {
            const next = { ...text, m: v };
            setText(next);
            emit(next);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              focusNext("minutes");
            }
          }}
          onMinus={() => bumpField("m", -5)}
          onPlus={() => bumpField("m", 5)}
        />

        <FieldRow
          label="מרחק משוער (ק״מ)"
          inputId="km"
          inputRef={kmRef}
          fieldValue={text.k}
          inputMode="numeric"
          onValueChange={(v) => {
            const next = { ...text, k: v };
            setText(next);
            emit(next);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              focusNext("km");
            }
          }}
          onMinus={() => bumpField("k", -1)}
          onPlus={() => bumpField("k", 1)}
        />

        {mode === "advanced" && (
          <>
            <label className="flex items-center justify-between rounded-xl border border-border p-3 text-base">
              <span className="font-semibold">שעת עומס</span>
              <input type="checkbox" className="h-5 w-5" checked={value.isPeakHour} onChange={setBool("isPeakHour")} />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-border p-3 text-base">
              <span className="font-semibold">יעד באזור חם</span>
              <input type="checkbox" className="h-5 w-5" checked={value.inHotZone} onChange={setBool("inHotZone")} />
            </label>

            <div>
              <label className="label-base" htmlFor="chance">
                סיכוי להזמנה הבאה
              </label>
              <select
                id="chance"
                value={value.nextOrderChance}
                onChange={(e) => onChange({ ...value, nextOrderChance: e.target.value as NextOrderChance })}
                className="input-base text-base font-medium"
              >
                {chanceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
