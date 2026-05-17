import type { MetadataRoute } from "next";

const THEME = "#02040a";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/app",
    name: "DeliveryCalc — מחשבון שליח",
    short_name: "DeliveryCalc",
    description: "מחשבון רווח לשליחים — Wolt, Ten Bis, HaAt. עובד גם ללא אינטרנט.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: THEME,
    theme_color: THEME,
    lang: "he",
    dir: "rtl",
    categories: ["finance", "productivity", "utilities"],
    prefer_related_applications: false,
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      }
    ],
    screenshots: []
  };
}
