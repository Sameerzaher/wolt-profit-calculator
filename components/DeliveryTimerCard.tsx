"use client";

import { useEffect, useState } from "react";

type Props = {
  acceptedAt: string;
};

export default function DeliveryTimerCard({ acceptedAt }: Props) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(acceptedAt).getTime()) / 1000);
      setSeconds(Math.max(0, elapsed));
    }, 1000);
    return () => clearInterval(interval);
  }, [acceptedAt]);

  const minutes = Math.floor(seconds / 60);
  const remSeconds = seconds % 60;

  return (
    <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4">
      <p className="text-sm text-emerald-200">זמן משלוח רץ</p>
      <p className="mt-1 text-3xl font-black text-white">
        {String(minutes).padStart(2, "0")}:{String(remSeconds).padStart(2, "0")}
      </p>
    </div>
  );
}
