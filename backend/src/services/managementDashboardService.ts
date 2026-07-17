import { simulateInventory } from "./simulationService";
import { forecastDemandByHour } from "./demandForecastService";
import { getKitchenBoard, getBottlenecks } from "./kitchenService";
import { prisma } from "../lib/prisma";

export async function getIntegratedDashboard() {
  // Run all services in parallel
  const [inventory, demandForecast, kitchenBoard, bottlenecks, salesMetrics] = await Promise.all([
    simulateInventory(),
    forecastDemandByHour(),
    getKitchenBoard(),
    getBottlenecks(),
    getSalesMetrics(),
  ]);

  // Process inventory data - get top 3 critical products
  const criticalProducts = inventory.items
    .filter((p: any) => p.status === "CRÍTICO")
    .slice(0, 3);

  // Process demand forecast - get next 4 hours
  const nextHoursForecast = demandForecast.forecasts.slice(0, 4);

  // Process kitchen board - count by status
  const kitchenCounts = {
    pending: kitchenBoard.filter((o: any) => o.status === "PENDING").length,
    preparing: kitchenBoard.filter((o: any) => o.status === "PREPARING").length,
    ready: kitchenBoard.filter((o: any) => o.status === "READY").length,
  };

  return {
    inventory: {
      criticalProducts,
      totalProducts: inventory.items.length,
      criticalCount: inventory.items.filter((p: any) => p.status === "CRÍTICO").length,
    },
    demand: {
      nextHoursForecast,
      source: demandForecast.source,
      modelId: demandForecast.modelId,
      algorithm: demandForecast.algorithm,
    },
    kitchen: {
      counts: kitchenCounts,
      bottlenecks: bottlenecks.bottlenecks,
      avgWaitTime: bottlenecks.avgWaitTime,
      avgPreparationTime: bottlenecks.avgPreparationTime,
    },
    sales: salesMetrics,
    timestamp: new Date().toISOString(),
  };
}

async function getSalesMetrics() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayOrders, todayRevenue, totalOrders] = await Promise.all([
    prisma.order.count({
      where: {
        createdAt: { gte: today, lt: tomorrow },
        status: { not: "CANCELLED" },
      },
    }),
    prisma.order.aggregate({
      where: {
        createdAt: { gte: today, lt: tomorrow },
        status: { not: "CANCELLED" },
      },
      _sum: { total: true },
    }),
    prisma.order.count({
      where: { status: { not: "CANCELLED" } },
    }),
  ]);

  return {
    todayOrders,
    todayRevenue: todayRevenue._sum.total || 0,
    totalOrders,
  };
}
