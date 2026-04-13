"use client";

import type { ChangeEvent, KeyboardEvent, Ref } from "react";
import { useEffect, useRef, useState } from "react";
import type { CalculatorInput } from "@/lib/types";
import { parseIntLoose, parseMoney, validateCalculatorInput } from "@/lib/inputValidation";

type CalculatorFormProps = {
  value: CalculatorInput;
  onChange: (next: CalculatorInput) => void;
  onValidityChange: (issues: string[]) => void;
};

function clampPrice(n: number): number {
  return Math.min(5000, Math.max(0, n));
}

function clampKm(n: number): number {
  return Math.min(150, Math.max(0.1, Math.round(n * 10) / 10));
}

function clampMinutes(n: number): number {
  return Math.min(400, Math.max(1, Math.round(n)));
}

function clampTip(n: number): number {
  return Math.min(2000, Math.max(0, n));
}

type Fields = { price: string; km: string; minutes: string; tip: string };

function tryCommit(
  text: Fields,
  flags: Pick<CalculatorInput, "isDoubleOrder" | "leavesHotZone">
): { ok: true; next: CalculatorInput } | { ok: false; issues: string[] } {
  const price = parseMoney(text.price);
  const km = parseMoney(text.km);
  const minutesEmpty = text.minutes.trim() === "";
  const minutesParsed = minutesEmpty ? null : parseIntLoose(text.minutes);
  const tipRaw = text.tip.trim() === "" ? 0 : parseMoney(text.tip);

  if (price === null || km === null) {
    const partial: CalculatorInput = {
      price: price ?? -1,
      distanceKm: km ?? -1,
      estimatedMinutes: minutesEmpty ? null : minutesParsed,
      cashTip: tipRaw === null ? -1 : tipRaw,
      isDoubleOrder: flags.isDoubleOrder,
      leavesHotZone: flags.leavesHotZone
    };
    const v = validateCalculatorInput(partial);
    return {
      ok: false,
      issues: v.length ? v : ["מלא מחיר ומרחק."]
    };
  }

  if (!minutesEmpty && (minutesParsed === null || minutesParsed <= 0)) {
    return { ok: false, issues: ["הזן זמן משוער בדקות תקין, או השאר ריק."] };
  }

  if (tipRaw === null) {
    return { ok: false, issues: ["הזן טיפ מזומן תקין (או 0)."] };
  }

  const next: CalculatorInput = {
    price: clampPrice(price),
    distanceKm: clampKm(km),
    estimatedMinutes: minutesEmpty ? null : clampMinutes(minutesParsed as number),
    cashTip: clampTip(tipRaw),
    isDoubleOrder: flags.isDoubleOrder,
    leavesHotZone: flags.leavesHotZone
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
  onPlusExtra,
  optional
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
  optional?: boolean;
}) {
  return (
    <div>
      <label className="label-base" htmlFor={inputId}>
        {label}
        {optional && <span className="mr-1 text-sm font-normal text-muted">(רשות)</span>}
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

export default function CalculatorForm({ value, onChange, onValidityChange }: CalculatorFormProps) {
  const [text, setText] = useState<Fields>({
    price: String(value.price),
    km: String(value.distanceKm),
    minutes: value.estimatedMinutes === null ? "" : String(value.estimatedMinutes),
    tip: value.cashTip === 0 ? "" : String(value.cashTip)
  });

  const priceRef = useRef<HTMLInputElement>(null);
  const kmRef = useRef<HTMLInputElement>(null);
  const minutesRef = useRef<HTMLInputElement>(null);
  const tipRef = useRef<HTMLInputElement>(null);

  const syncKey = `${value.price}|${value.distanceKm}|${value.estimatedMinutes ?? ""}|${value.cashTip}|${value.isDoubleOrder}|${value.leavesHotZone}`;
  const lastSync = useRef("");

  useEffect(() => {
    if (syncKey !== lastSync.current) {
      lastSync.current = syncKey;
      setText({
        price: String(value.price),
        km: String(value.distanceKm),
        minutes: value.estimatedMinutes === null ? "" : String(value.estimatedMinutes),
        tip: value.cashTip === 0 ? "" : String(value.cashTip)
      });
    }
  }, [syncKey, value.price, value.distanceKm, value.estimatedMinutes, value.cashTip, value.isDoubleOrder, value.leavesHotZone]);

  useEffect(() => {
    const t = window.setTimeout(() => priceRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, []);

  const flags = { isDoubleOrder: value.isDoubleOrder, leavesHotZone: value.leavesHotZone };

  const emit = (nextText: Fields) => {
    const res = tryCommit(nextText, flags);
    if (res.ok) {
      onValidityChange([]);
      onChange(res.next);
    } else {
      onValidityChange(res.issues);
    }
  };

  const focusNext = (current: "price" | "km" | "minutes" | "tip") => {
    if (current === "price") kmRef.current?.focus();
    else if (current === "km") minutesRef.current?.focus();
    else if (current === "minutes") tipRef.current?.focus();
    else priceRef.current?.focus();
  };

  const bumpField = (field: keyof Fields, delta: number) => {
    const cur = tryCommit(text, flags);
    const base = cur.ok ? cur.next : value;
    let price = base.price;
    let km = base.distanceKm;
    let minutes = base.estimatedMinutes;
    let tip = base.cashTip;

    if (field === "price") price = clampPrice(price + delta);
    if (field === "km") km = clampKm(km + delta);
    if (field === "minutes") {
      const m = minutes === null ? 15 : minutes;
      minutes = clampMinutes(m + delta);
    }
    if (field === "tip") tip = clampTip(tip + delta);

    const nextText: Fields = {
      price: String(price),
      km: String(km),
      minutes: minutes === null ? "" : String(minutes),
      tip: tip === 0 ? "" : String(tip)
    };
    setText(nextText);
    emit(nextText);
  };

  const setBool = (key: "isDoubleOrder" | "leavesHotZone") => (e: ChangeEvent<HTMLInputElement>) => {
    const nextFlags = { ...flags, [key]: e.target.checked };
    const res = tryCommit(text, nextFlags);
    if (res.ok) {
      onValidityChange([]);
      onChange(res.next);
    } else {
      onValidityChange(res.issues);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">בדוק הזמנה</h2>
      </div>

      <div className="space-y-5">
        <FieldRow
          label="מחיר"
          inputId="price"
          inputRef={priceRef}
          fieldValue={text.price}
          inputMode="numeric"
          onValueChange={(v) => {
            const next = { ...text, price: v };
            setText(next);
            emit(next);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              focusNext("price");
            }
          }}
          onMinus={() => bumpField("price", -5)}
          onPlus={() => bumpField("price", 5)}
          onPlusExtra={() => bumpField("price", 10)}
        />

        <FieldRow
          label={"\u05de\u05e8\u05d7\u05e7 \u05d1\u05e7\u05f4\u05de"}
          inputId="km"
          inputRef={kmRef}
          fieldValue={text.km}
          inputMode="decimal"
          onValueChange={(v) => {
            const next = { ...text, km: v };
            setText(next);
            emit(next);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              focusNext("km");
            }
          }}
          onMinus={() => bumpField("km", -0.5)}
          onPlus={() => bumpField("km", 0.5)}
        />

        <FieldRow
          label="זמן משוער בדקות"
          optional
          inputId="minutes"
          inputRef={minutesRef}
          fieldValue={text.minutes}
          inputMode="numeric"
          onValueChange={(v) => {
            const next = { ...text, minutes: v };
            setText(next);
            emit(next);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              focusNext("minutes");
            }
          }}
          onMinus={() => bumpField("minutes", -5)}
          onPlus={() => bumpField("minutes", 5)}
        />

        <FieldRow
          label="טיפ מזומן"
          optional
          inputId="tip"
          inputRef={tipRef}
          fieldValue={text.tip}
          inputMode="numeric"
          onValueChange={(v) => {
            const next = { ...text, tip: v };
            setText(next);
            emit(next);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              focusNext("tip");
            }
          }}
          onMinus={() => bumpField("tip", -5)}
          onPlus={() => bumpField("tip", 5)}
        />

        <label className="flex min-h-[3.25rem] cursor-pointer items-center justify-between gap-3 rounded-2xl border-2 border-border px-4 py-3 text-lg font-semibold transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25">
          <span>דאבל?</span>
          <input
            type="checkbox"
            className="h-6 w-6 shrink-0 rounded border-border"
            checked={value.isDoubleOrder}
            onChange={setBool("isDoubleOrder")}
          />
        </label>

        <label className="flex min-h-[3.25rem] cursor-pointer items-center justify-between gap-3 rounded-2xl border-2 border-border px-4 py-3 text-lg font-semibold transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25">
          <span>מוציא מהאזור החם?</span>
          <input
            type="checkbox"
            className="h-6 w-6 shrink-0 rounded border-border"
            checked={value.leavesHotZone}
            onChange={setBool("leavesHotZone")}
          />
        </label>
      </div>
    </section>
  );
}
