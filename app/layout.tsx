import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wolt Delivery Calculator",
  description: "Personal mobile-first utility for Wolt delivery decisions",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Wolt Calc"
  }
};

export const viewport: Viewport = {
  themeColor: "#0a0c12"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
