import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "עוזר החלטות — משלוחי Wolt",
    short_name: "Wolt עוזר",
    description: "כלי מהיר לקבלת החלטות על הצעות משלוח",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0c12",
    theme_color: "#0a0c12",
    lang: "he",
    dir: "rtl",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      },
      {
        src: "/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable"
      }
    ]
  };
}
