import type { Metadata, Viewport } from "next";
import { AppDataProvider } from "@/components/AppDataProvider";
import { CourierProvider } from "@/components/CourierProvider";
import PwaShell from "@/components/pwa/PwaShell";
import AppBackground from "@/components/ui/AppBackground";
import "./globals.css";

const THEME_COLOR = "#02040a";

export const metadata: Metadata = {
  title: {
    default: "DeliveryCalc — פלטפורמת רווח לשליחים",
    template: "%s · DeliveryCalc"
  },
  description:
    "עקבו אחרי הרווח האמיתי שלכם — Wolt, Ten Bis, HaAt. ניתוחים, OCR מצילום מסך ו-PWA לנייד.",
  applicationName: "DeliveryCalc",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DeliveryCalc"
  },
  formatDetection: {
    telephone: false,
    email: false
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  other: {
    "mobile-web-app-capable": "yes"
  }
};

export const viewport: Viewport = {
  themeColor: THEME_COLOR,
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-[#02040a] text-slate-100 antialiased">
        <AppBackground />
        <CourierProvider>
          <AppDataProvider>
            <PwaShell>{children}</PwaShell>
          </AppDataProvider>
        </CourierProvider>
      </body>
    </html>
  );
}
