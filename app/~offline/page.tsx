import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="app-page flex min-h-[70dvh] flex-col items-center justify-center text-center">
      <p className="text-5xl" aria-hidden>
        📡
      </p>
      <h1 className="mt-4 text-2xl font-black text-white">אין חיבור לאינטרנט</h1>
      <p className="mt-2 max-w-xs text-sm text-slate-400">
        האפליקציה זמינה במצב לא מקוון. הנתונים שלך נשמרים במכשיר — חזור לאינטרנט לסנכרון מלא.
      </p>
      <Link
        href="/app"
        className="mt-8 flex min-h-[3rem] min-w-[12rem] items-center justify-center rounded-2xl bg-emerald-500 text-sm font-black text-slate-950"
      >
        חזרה ללוח הבקרה
      </Link>
    </main>
  );
}
