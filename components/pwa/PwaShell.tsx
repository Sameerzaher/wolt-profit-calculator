"use client";

import InstallPrompt from "@/components/pwa/InstallPrompt";
import OfflineBanner from "@/components/pwa/OfflineBanner";
import SplashScreen from "@/components/pwa/SplashScreen";

export default function PwaShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SplashScreen />
      <OfflineBanner />
      {children}
      <InstallPrompt />
    </>
  );
}
