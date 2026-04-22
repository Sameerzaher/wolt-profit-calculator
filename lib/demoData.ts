import { calculateFuelCost, calculateQuickCheck } from "@/lib/scoring";
import type { Delivery, FuelSettings, Shift } from "@/types/models";

export function createDemoData(fuelSettings: FuelSettings): { deliveries: Delivery[]; shifts: Shift[] } {
  const now = new Date();
  const shiftId = crypto.randomUUID();
  const shift: Shift = {
    id: shiftId,
    dateKey: now.toISOString().slice(0, 10),
    startedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
    endedAt: now.toISOString(),
    deliveryIds: [],
    idleTimeEstimateMinutes: 38
  };

  const raw = [
    { offerAmount: 34, estimatedKm: 3.5, estimatedMinutes: 21, pickupZone: "חיפה מרכז", dropoffZone: "מת״מ" },
    { offerAmount: 27, estimatedKm: 6.2, estimatedMinutes: 31, pickupZone: "חיפה מרכז", dropoffZone: "קרית ים" },
    { offerAmount: 41, estimatedKm: 4.6, estimatedMinutes: 24, pickupZone: "קרית מוצקין", dropoffZone: "BIG קריות" }
  ];

  const deliveries: Delivery[] = raw.map((item, index) => {
    const acceptedAt = new Date(now.getTime() - (index + 1) * 70 * 60 * 1000).toISOString();
    const result = calculateQuickCheck(
      {
        ...item,
        timeOfDay: "ערב",
        weatherBonus: index === 0,
        trafficLevel: index === 1 ? "high" : "medium",
        hardParking: index === 1
      },
      fuelSettings,
      ["מת״מ", "BIG קריות"]
    );

    const actualKm = item.estimatedKm + (index === 2 ? 0.3 : 0.2);
    const actualMinutes = item.estimatedMinutes + (index === 1 ? 8 : 3);
    const tipCash = index === 0 ? 6 : index === 2 ? 4 : 0;
    const finalNetProfit = item.offerAmount + tipCash - calculateFuelCost(actualKm, fuelSettings);

    const id = crypto.randomUUID();
    shift.deliveryIds.push(id);

    return {
      id,
      shiftId,
      status: "completed",
      acceptedAt,
      pickedUpAt: new Date(new Date(acceptedAt).getTime() + 7 * 60 * 1000).toISOString(),
      deliveredAt: new Date(new Date(acceptedAt).getTime() + actualMinutes * 60 * 1000).toISOString(),
      ...result,
      ...item,
      timeOfDay: "ערב",
      weatherBonus: index === 0,
      trafficLevel: index === 1 ? "high" : "medium",
      hardParking: index === 1,
      quickCheckResult: result,
      completion: {
        actualAmount: item.offerAmount,
        tipCash,
        actualKm,
        actualMinutes,
        restaurantDelay: index === 1,
        dropoffDemandQuality: index === 1 ? "bad" : "good",
        deliveryRating: index === 2 ? "ok" : "good",
        notes: index === 1 ? "פקק ואיתור כתובת איטי" : ""
      },
      finalNetProfit,
      finalIlsPerHour: finalNetProfit / (actualMinutes / 60),
      estimatedFuelCost: calculateFuelCost(actualKm, fuelSettings)
    };
  });

  return { deliveries, shifts: [shift] };
}
