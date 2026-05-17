import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: true,
  cacheOnFrontEndNav: true,
  cacheStartUrl: true,
  dynamicStartUrl: false,
  fallbacks: {
    document: "/~offline"
  },
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts",
          expiration: { maxEntries: 8, maxAgeSeconds: 365 * 24 * 60 * 60 }
        }
      },
      {
        urlPattern: /\.(?:js|css)$/i,
        handler: "StaleWhileRevalidate",
        options: { cacheName: "static-assets" }
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "images",
          expiration: { maxEntries: 64, maxAgeSeconds: 30 * 24 * 60 * 60 }
        }
      },
      {
        urlPattern: /^https?.*/,
        handler: "NetworkFirst",
        options: {
          cacheName: "pages",
          networkTimeoutSeconds: 8,
          expiration: { maxEntries: 48, maxAgeSeconds: 24 * 60 * 60 }
        }
      }
    ]
  }
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [
      { source: "/add-shift", destination: "/app/add-shift", permanent: false },
      { source: "/import-screenshot", destination: "/app/import-screenshot", permanent: false },
      { source: "/courier-insights", destination: "/app/courier-insights", permanent: false },
      { source: "/settings/vehicle", destination: "/app/settings/vehicle", permanent: false },
      { source: "/analytics", destination: "/dashboard", permanent: false },
      { source: "/analytics/:path*", destination: "/dashboard", permanent: false },
      { source: "/ocr", destination: "/app/import-screenshot", permanent: false },
      { source: "/platform-analytics", destination: "/dashboard", permanent: false },
      { source: "/daily-shift", destination: "/app/add-shift", permanent: false }
    ];
  }
};

export default withPWA(nextConfig);
