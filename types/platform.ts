export type DeliveryPlatform = "wolt" | "tenbis" | "haat";

export const PLATFORMS: DeliveryPlatform[] = ["wolt", "tenbis", "haat"];

export const PLATFORM_LABELS: Record<DeliveryPlatform, string> = {
  wolt: "Wolt",
  tenbis: "Ten Bis",
  haat: "HaAt"
};

export const PLATFORM_COLORS: Record<DeliveryPlatform, "emerald" | "amber" | "sky"> = {
  wolt: "emerald",
  tenbis: "amber",
  haat: "sky"
};
