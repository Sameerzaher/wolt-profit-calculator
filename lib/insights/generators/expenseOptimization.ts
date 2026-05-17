import type { CourierInsight } from "@/types/insights";
import { getVehicleExpenseContext, type InsightContext } from "@/lib/insights/context";
import { finalizeInsightScore } from "@/lib/insights/scoring";

const VEHICLE_LABELS = {
  car: "רכב",
  scooter: "קטנוע",
  electric: "רכב חשמלי"
} as const;

export function generateExpenseInsights(ctx: InsightContext): CourierInsight[] {
  const insights: CourierInsight[] = [];
  const { weekTotals, vehicle } = ctx;
  const vehicleCtx = getVehicleExpenseContext(vehicle);

  if (weekTotals.fuel > 0 && weekTotals.net > 0) {
    const fuelShare = (weekTotals.fuel / weekTotals.income) * 100;
    if (fuelShare >= 25) {
      insights.push({
        id: "expense-fuel-high",
        category: "expense_optimization",
        tone: "warning",
        title: "עלות דלק גבוהה",
        message: `דלק שוחק ${fuelShare.toFixed(0)}% מההכנסה השבוע (${VEHICLE_LABELS[vehicle.type]}). בדוק ק״מ למקטע או אזורי עבודה.`,
        score: finalizeInsightScore(76, ctx.weekSegments.length),
        metric: `${fuelShare.toFixed(0)}%`
      });
    }
  }

  if (vehicle.type === "scooter" && weekTotals.fixed > weekTotals.net * 0.25 && weekTotals.net > 0) {
    insights.push({
      id: "expense-scooter-fixed",
      category: "expense_optimization",
      tone: "warning",
      title: "הוצאות קטנוע מורידות רווח",
      message: `עלויות קבועות של הקטנוע (ביטוח/תחזוקה) מקטינות את הרווח הנטו — ₪${weekTotals.fixed.toFixed(0)} השבוע מעבר לדלק.`,
      score: finalizeInsightScore(82, ctx.weekDays.length),
      metric: `₪${weekTotals.fixed.toFixed(0)}`
    });
  }

  if (vehicle.monthlyInsurance + vehicle.monthlyMaintenance > 800 && weekTotals.activeDays < 4) {
    insights.push({
      id: "expense-few-days-fixed",
      category: "expense_optimization",
      tone: "recommendation",
      title: "עלויות קבועות על מעט ימים",
      message: `עבדת ${weekTotals.activeDays} ימים השבוע — עלות קבועה יומית של ₪${vehicleCtx.dailyFixed.toFixed(0)} "דולקת" על כל יום עבודה.`,
      score: finalizeInsightScore(65, weekTotals.activeDays),
      metric: `₪${vehicleCtx.dailyFixed.toFixed(0)}/יום`
    });
  }

  if (weekTotals.km > 0 && weekTotals.income > 0) {
    const incomePerKm = weekTotals.income / weekTotals.km;
    const fuelPerKm = vehicle.fuelCostPerKm;
    if (incomePerKm < fuelPerKm * 2.5) {
      insights.push({
        id: "expense-km-efficiency",
        category: "expense_optimization",
        tone: "recommendation",
        title: "יעילות קילומטר נמוכה",
        message: `ממוצע ₪${incomePerKm.toFixed(2)} לק״מ לעומת עלות דלק ₪${fuelPerKm.toFixed(2)} — נסה אזורים צפופים יותר.`,
        score: finalizeInsightScore(70, ctx.weekSegments.length),
        metric: `₪${incomePerKm.toFixed(2)}/ק״מ`
      });
    }
  }

  return insights;
}
