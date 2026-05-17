import type { DeliveryPlatform } from "@/types/platform";

export type SegmentWeather = "clear" | "rain" | "heat" | "cold";

export interface ShiftSegment {
  id: string;
  platform: DeliveryPlatform;
  startTime: string;
  endTime: string;
  endsNextDay?: boolean;
  income: number;
  kilometers: number;
  deliveriesCount: number;
  notes?: string;
  weather?: SegmentWeather;
  rushHour: boolean;
}

export interface ShiftDay {
  id: string;
  date: string;
  segments: ShiftSegment[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
