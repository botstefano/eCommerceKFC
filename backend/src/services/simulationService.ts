import { prisma } from "../lib/prisma";

type OrderItem = { productId: string; quantity: number };

function parseItems(raw: unknown): OrderItem[] {
  if (!raw) return [];
  try {
    const arr = Array.isArray(raw) ? raw : JSON.parse(raw as string);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// 1. ML vs Sin ML
// ---------------------------------------------------------------------------
export async function simulateMlVsNoMl(assumedMonthlyVisits = 12000) {
  const orders = await prisma.order.findMany({ select: { total: true } });
  const realAOV = orders.length > 0 ? orders.reduce((s, o) => s + o.total, 0) / orders.length : 9.5;

  // Baseline ("Sin ML"): generic catalog browsing, no personalization
  const baseline = {
    ctr: 0.024, // 2.4% click-through on suggested items
    conversion: 0.012, // 1.2% of sessions convert
    aov: Math.round(realAOV * 100) / 100,
    avgSearchTimeSeconds: 95,
  };

  // With recommendation engine ("Con ML"): documented, conservative industry uplifts
  // applied to the same baseline so the comparison stays grounded in real AOV data.
  const withMl = {
    ctr: Math.round(baseline.ctr * 1.85 * 10000) / 10000,
    conversion: Math.round(baseline.conversion * 1.45 * 10000) / 10000,
    aov: Math.round(baseline.aov * 1.12 * 100) / 100,
    avgSearchTimeSeconds: Math.round(baseline.avgSearchTimeSeconds * 0.6),
  };

  const baselineRevenue = assumedMonthlyVisits * baseline.conversion * baseline.aov;
  const withMlRevenue = assumedMonthlyVisits * withMl.conversion * withMl.aov;

  return {
    assumptions: {
      assumedMonthlyVisits,
      note: "AOV calculado de pedidos reales en la base de datos; CTR/conversión usan uplifts conservadores de la industria de e-commerce con motores de recomendación.",
    },
    baseline: { ...baseline, monthlyRevenue: Math.round(baselineRevenue * 100) / 100 },
    withMl: { ...withMl, monthlyRevenue: Math.round(withMlRevenue * 100) / 100 },
    uplift: {
      ctrPercent: Math.round(((withMl.ctr - baseline.ctr) / baseline.ctr) * 1000) / 10,
      conversionPercent: Math.round(((withMl.conversion - baseline.conversion) / baseline.conversion) * 1000) / 10,
      aovPercent: Math.round(((withMl.aov - baseline.aov) / baseline.aov) * 1000) / 10,
      revenuePercent: Math.round(((withMlRevenue - baselineRevenue) / baselineRevenue) * 1000) / 10,
      searchTimeReductionPercent: Math.round(
        ((baseline.avgSearchTimeSeconds - withMl.avgSearchTimeSeconds) / baseline.avgSearchTimeSeconds) * 1000
      ) / 10,
    },
  };
}

// ---------------------------------------------------------------------------
// 2. Tráfico por hora
// ---------------------------------------------------------------------------
const HOURLY_WEIGHTS_WEEKDAY = [
  1, 1, 0.5, 0.5, 0.5, 1, 3, 6, 5, 4, 5, 9, 14, 13, 8, 6, 6, 8, 14, 15, 10, 7, 4, 2,
];
const HOURLY_WEIGHTS_WEEKEND = [
  2, 1.5, 1, 0.5, 0.5, 1, 2, 4, 6, 8, 10, 13, 15, 14, 11, 9, 8, 9, 13, 16, 13, 10, 6, 3,
];

export function simulateTrafficByHour(totalWeeklyOrdersEstimate = 2400) {
  const weekdayTotal = HOURLY_WEIGHTS_WEEKDAY.reduce((a, b) => a + b, 0);
  const weekendTotal = HOURLY_WEIGHTS_WEEKEND.reduce((a, b) => a + b, 0);
  // 5 weekdays + 2 weekend days share the weekly volume, weekend days run ~20% hotter per day
  const weekdayDayVolume = totalWeeklyOrdersEstimate / (5 + 2 * 1.2);
  const weekendDayVolume = weekdayDayVolume * 1.2;

  const hours = Array.from({ length: 24 }, (_, hour) => {
    const weekdayOrders = Math.round((HOURLY_WEIGHTS_WEEKDAY[hour] / weekdayTotal) * weekdayDayVolume);
    const weekendOrders = Math.round((HOURLY_WEIGHTS_WEEKEND[hour] / weekendTotal) * weekendDayVolume);
    return { hour, weekdayOrders, weekendOrders };
  });

  const peaks = hours
    .filter((h) => h.hour === 12 || h.hour === 13 || h.hour === 18 || h.hour === 19 || h.hour === 20)
    .map((h) => h.hour);

  return {
    hours,
    peakHours: [...new Set(peaks)],
    note: "Modelo basado en patrones típicos de QSR: picos de almuerzo (12-2pm) y cena (6-8pm); fines de semana ~20% más tráfico por día.",
  };
}

// ---------------------------------------------------------------------------
// 3. Inventario
// ---------------------------------------------------------------------------
export async function simulateInventory(criticalThreshold = 20, leadTimeDays = 3) {
  const products = await prisma.product.findMany();
  const orders = await prisma.order.findMany({ select: { items: true, createdAt: true } });

  const soldByProduct = new Map<string, number>();
  let earliestOrder = new Date();
  for (const order of orders) {
    if (order.createdAt < earliestOrder) earliestOrder = order.createdAt;
    for (const item of parseItems(order.items)) {
      soldByProduct.set(item.productId, (soldByProduct.get(item.productId) || 0) + item.quantity);
    }
  }
  const daysOfHistory = Math.max(1, Math.ceil((Date.now() - earliestOrder.getTime()) / (1000 * 60 * 60 * 24)));

  const report = products.map((p) => {
    const totalSold = soldByProduct.get(p.id) || 0;
    const avgDailySales = totalSold > 0 ? totalSold / daysOfHistory : 1.5; // heuristic fallback for thin seed data
    const daysOfStockLeft = p.stock / avgDailySales;
    const suggestedReorder = Math.max(0, Math.round(avgDailySales * leadTimeDays * 2 - p.stock));
    return {
      productId: p.id,
      name: p.name,
      category: p.category,
      stock: p.stock,
      avgDailySales: Math.round(avgDailySales * 10) / 10,
      daysOfStockLeft: Math.round(daysOfStockLeft * 10) / 10,
      status: p.stock < criticalThreshold || daysOfStockLeft < leadTimeDays ? "CRÍTICO" : daysOfStockLeft < leadTimeDays * 2 ? "ATENCIÓN" : "OK",
      suggestedReorder,
    };
  });

  return {
    leadTimeDays,
    criticalThreshold,
    items: report.sort((a, b) => a.daysOfStockLeft - b.daysOfStockLeft),
  };
}

// ---------------------------------------------------------------------------
// 4. Personal en cocina
// ---------------------------------------------------------------------------
export async function simulateKitchenStaffing(minutesActivePerCookPerHour = 50) {
  const products = await prisma.product.findMany({ select: { preparationTime: true } });
  const avgPrepTime = products.length > 0 ? products.reduce((s, p) => s + p.preparationTime, 0) / products.length : 8;

  const traffic = simulateTrafficByHour();
  const staffing = traffic.hours.map((h) => {
    const ordersThisHour = Math.max(h.weekdayOrders, h.weekendOrders);
    const totalPrepMinutes = ordersThisHour * avgPrepTime;
    const cooksNeeded = Math.max(1, Math.ceil(totalPrepMinutes / minutesActivePerCookPerHour));
    const estimatedWaitMinutes = Math.round((totalPrepMinutes / cooksNeeded / minutesActivePerCookPerHour) * avgPrepTime * 10) / 10;
    return {
      hour: h.hour,
      ordersEstimate: ordersThisHour,
      cooksNeeded,
      estimatedWaitMinutes: Math.min(estimatedWaitMinutes, 25),
    };
  });

  return { avgPrepTimeMinutes: Math.round(avgPrepTime * 10) / 10, staffing };
}

// ---------------------------------------------------------------------------
// 5. Delivery por zona
// ---------------------------------------------------------------------------
const ZONES = [
  { name: "Zona 1 (0-2 km)", minKm: 0, maxKm: 2 },
  { name: "Zona 2 (2-5 km)", minKm: 2, maxKm: 5 },
  { name: "Zona 3 (5-10 km)", minKm: 5, maxKm: 10 },
  { name: "Zona 4 (+10 km)", minKm: 10, maxKm: 18 },
];

export function simulateDeliveryByZone(isPeakHour = false) {
  const surge = isPeakHour ? 1.35 : 1;
  return ZONES.map((zone) => {
    const avgDistance = (zone.minKm + zone.maxKm) / 2;
    const baseTimeMinutes = 12 + avgDistance * 3.2;
    const baseCost = 3.5 + avgDistance * 1.1;
    return {
      zone: zone.name,
      avgDistanceKm: avgDistance,
      estimatedDeliveryMinutes: Math.round(baseTimeMinutes * surge),
      deliveryCost: Math.round(baseCost * surge * 100) / 100,
      surgeApplied: isPeakHour,
    };
  });
}
