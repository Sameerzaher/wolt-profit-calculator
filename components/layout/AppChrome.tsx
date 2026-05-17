"use client";

import BottomNav from "@/components/BottomNav";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";

export default function AppChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OnboardingFlow />
      <div className="app-shell mx-auto min-h-[100dvh] max-w-lg px-4 pt-[max(env(safe-area-inset-top),0.75rem)]">
        {children}
      </div>
      <BottomNav />
    </>
  );
}
