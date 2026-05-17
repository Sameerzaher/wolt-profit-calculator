import type { Metadata } from "next";
import { AppDataProvider } from "@/components/AppDataProvider";
import BottomNav from "@/components/BottomNav";
import StickyShiftSummaryBar from "@/components/StickyShiftSummaryBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeliveryCalc",
  description: "מחשבון רווח לשליחים — Wolt, HaAt ו-Ten Bis"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="bg-slate-950 text-slate-100">
        <AppDataProvider>
          <div className="mx-auto min-h-screen max-w-lg px-4 pb-[var(--app-footer-offset)] pt-4">{children}</div>
          <StickyShiftSummaryBar />
          <BottomNav />
        </AppDataProvider>
      </body>
    </html>
  );
}
