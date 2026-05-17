"use client";

import { useRef, useState } from "react";
import { PLATFORMS, PLATFORM_LABELS } from "@/types/platform";
import type { DeliveryPlatform } from "@/types/platform";
import type { OcrUploadItem } from "@/types/ocr";

type Props = {
  platform: DeliveryPlatform;
  onPlatformChange: (platform: DeliveryPlatform) => void;
  uploads: OcrUploadItem[];
  onAddFiles: (files: FileList | File[]) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
};

export default function ScreenshotUploadZone({
  platform,
  onPlatformChange,
  uploads,
  onAddFiles,
  onRemove,
  disabled
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const onPick = () => inputRef.current?.click();

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    onAddFiles(files);
  };

  return (
    <section className="space-y-4">
      <div className="app-card">
        <p className="text-sm font-bold text-slate-200">פלטפורמה</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {PLATFORMS.map((p) => (
            <button
              key={p}
              type="button"
              disabled={disabled}
              onClick={() => onPlatformChange(p)}
              className={`btn-pill ${platform === p ? "btn-pill-active" : "btn-pill-idle"}`}
            >
              {PLATFORM_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onPick()}
        onClick={onPick}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`app-card flex min-h-[10rem] cursor-pointer flex-col items-center justify-center border-dashed text-center transition ${
          dragging ? "border-emerald-400 bg-emerald-500/10" : "border-slate-700"
        } ${disabled ? "pointer-events-none opacity-50" : ""}`}
      >
        <p className="text-3xl">📷</p>
        <p className="mt-2 text-sm font-bold text-white">העלאת צילום מסך</p>
        <p className="mt-1 text-xs text-slate-400">לחצו או גררו · מותאם לנייד</p>
        <p className="mt-2 text-[11px] text-slate-500">Wolt Courier · Ten Bis · HaAt</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {uploads.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {uploads.map((item) => (
            <li key={item.id} className="relative overflow-hidden rounded-xl border border-slate-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.previewUrl} alt="" className="aspect-[9/16] w-full object-cover" />
              <button
                type="button"
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(item.id);
                }}
                className="absolute left-2 top-2 rounded-lg bg-slate-950/90 px-2 py-1 text-[10px] font-bold text-rose-200"
              >
                הסר
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
