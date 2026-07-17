import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import {
  simulateMlVsNoMl,
  simulateTrafficByHour,
  simulateInventory,
  simulateKitchenStaffing,
  simulateDeliveryByZone,
} from "../services/simulationService";
import { streamMlVsNoMlPdf } from "../services/pdfReportService";
import { getIntegratedDashboard } from "../services/managementDashboardService";

export async function dashboardSummary(_req: Request, res: Response) {
  const [userCount, orderCount, productCount, orders, pendingTickets] = await Promise.all([
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.order.count(),
    prisma.product.count(),
    prisma.order.findMany({ select: { total: true, status: true, createdAt: true } }),
    prisma.supportTicket.count({ where: { status: "OPEN" } }),
  ]);

  const revenue = orders.reduce((sum, o) => sum + o.total, 0);
  const statusBreakdown: Record<string, number> = {};
  for (const o of orders) statusBreakdown[o.status] = (statusBreakdown[o.status] || 0) + 1;

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const key = date.toISOString().slice(0, 10);
    const dayOrders = orders.filter((o) => o.createdAt.toISOString().slice(0, 10) === key);
    return { date: key, orders: dayOrders.length, revenue: Math.round(dayOrders.reduce((s, o) => s + o.total, 0) * 100) / 100 };
  });

  res.json({
    userCount,
    orderCount,
    productCount,
    totalRevenue: Math.round(revenue * 100) / 100,
    avgOrderValue: orders.length > 0 ? Math.round((revenue / orders.length) * 100) / 100 : 0,
    statusBreakdown,
    pendingTickets,
    last7Days,
  });
}

export async function simulationMlVsNoMl(req: Request, res: Response) {
  const visits = req.query.visits ? Number(req.query.visits) : undefined;
  const report = await simulateMlVsNoMl(visits);
  res.json(report);
}

export async function simulationMlVsNoMlPdf(req: Request, res: Response) {
  const visits = req.query.visits ? Number(req.query.visits) : undefined;
  const report = await simulateMlVsNoMl(visits);
  streamMlVsNoMlPdf(report, res);
}

export async function simulationTraffic(req: Request, res: Response) {
  const estimate = req.query.weeklyOrders ? Number(req.query.weeklyOrders) : undefined;
  res.json(simulateTrafficByHour(estimate));
}

export async function simulationInventory(req: Request, res: Response) {
  const threshold = req.query.threshold ? Number(req.query.threshold) : undefined;
  const leadTime = req.query.leadTimeDays ? Number(req.query.leadTimeDays) : undefined;
  res.json(await simulateInventory(threshold, leadTime));
}

export async function simulationStaffing(req: Request, res: Response) {
  const minutesPerCook = req.query.minutesPerCook ? Number(req.query.minutesPerCook) : undefined;
  res.json(await simulateKitchenStaffing(minutesPerCook));
}

export async function simulationDelivery(req: Request, res: Response) {
  const isPeak = req.query.peak === "true";
  res.json({ zones: simulateDeliveryByZone(isPeak) });
}

export async function integratedDashboard(_req: Request, res: Response) {
  const dashboard = await getIntegratedDashboard();
  res.json(dashboard);
}
