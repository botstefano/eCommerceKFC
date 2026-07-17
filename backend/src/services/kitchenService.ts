import { prisma } from "../lib/prisma";

export async function getKitchenBoard() {
  const orders = await prisma.order.findMany({
    where: {
      status: {
        in: ["PENDING", "PREPARING", "READY"],
      },
    },
    include: {
      user: {
        select: {
          name: true,
          phone: true,
        },
      },
    },
    orderBy: [
      { status: "asc" }, // PENDING first
      { createdAt: "asc" }, // Oldest first
      { scheduledTime: "asc" }, // Scheduled orders first
    ],
  });

  const now = new Date();

  const ordersWithTiming = orders.map((order) => {
    const createdAt = new Date(order.createdAt);
    const kitchenStartedAt = order.kitchenStartedAt ? new Date(order.kitchenStartedAt) : null;
    const kitchenReadyAt = order.kitchenReadyAt ? new Date(order.kitchenReadyAt) : null;
    const qualityCheckedAt = order.qualityCheckedAt ? new Date(order.qualityCheckedAt) : null;

    const timeSinceCreated = Math.floor((now.getTime() - createdAt.getTime()) / 1000 / 60); // minutes
    const timeSinceStarted = kitchenStartedAt ? Math.floor((now.getTime() - kitchenStartedAt.getTime()) / 1000 / 60) : null;

    return {
      ...order,
      timeSinceCreated,
      timeSinceStarted,
      kitchenStartedAt,
      kitchenReadyAt,
      qualityCheckedAt,
    };
  });

  return ordersWithTiming;
}

export async function startPreparation(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error("Pedido no encontrado");
  }

  if (order.status !== "PENDING") {
    throw new Error("Solo se puede iniciar preparación de pedidos en estado PENDING");
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "PREPARING",
      kitchenStartedAt: new Date(),
    },
  });

  return updatedOrder;
}

export async function markQualityChecked(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error("Pedido no encontrado");
  }

  if (order.status !== "PREPARING") {
    throw new Error("Solo se puede marcar control de calidad en pedidos en preparación");
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      qualityCheckedAt: new Date(),
    },
  });

  return updatedOrder;
}

export async function markReady(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error("Pedido no encontrado");
  }

  if (order.status !== "PREPARING") {
    throw new Error("Solo se puede marcar listo pedidos en preparación");
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "READY",
      kitchenReadyAt: new Date(),
    },
  });

  return updatedOrder;
}

export async function getBottlenecks() {
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: twentyFourHoursAgo,
      },
      kitchenStartedAt: { not: null },
      kitchenReadyAt: { not: null },
    },
    select: {
      id: true,
      createdAt: true,
      kitchenStartedAt: true,
      kitchenReadyAt: true,
      items: true,
    },
  });

  const bottlenecks = [];

  for (const order of orders) {
    const createdAt = new Date(order.createdAt);
    const kitchenStartedAt = new Date(order.kitchenStartedAt!);
    const kitchenReadyAt = new Date(order.kitchenReadyAt!);

    const waitTime = Math.floor((kitchenStartedAt.getTime() - createdAt.getTime()) / 1000 / 60); // minutes
    const preparationTime = Math.floor((kitchenReadyAt.getTime() - kitchenStartedAt.getTime()) / 1000 / 60); // minutes

    const items = order.items as any[];
    const maxPreparationTime = Math.max(...items.map((item) => item.product?.preparationTime || 10));

    // Mark as bottleneck if preparation time exceeds expected by 50%
    const isBottleneck = preparationTime > maxPreparationTime * 1.5;

    if (isBottleneck) {
      bottlenecks.push({
        orderId: order.id,
        waitTime,
        preparationTime,
        expectedTime: maxPreparationTime,
        excessPercentage: Math.round(((preparationTime - maxPreparationTime) / maxPreparationTime) * 100),
      });
    }
  }

  // Calculate averages
  const avgWaitTime = orders.length > 0 
    ? orders.reduce((sum, order) => {
        const createdAt = new Date(order.createdAt);
        const kitchenStartedAt = new Date(order.kitchenStartedAt!);
        return sum + Math.floor((kitchenStartedAt.getTime() - createdAt.getTime()) / 1000 / 60);
      }, 0) / orders.length
    : 0;

  const avgPreparationTime = orders.length > 0
    ? orders.reduce((sum, order) => {
        const kitchenStartedAt = new Date(order.kitchenStartedAt!);
        const kitchenReadyAt = new Date(order.kitchenReadyAt!);
        return sum + Math.floor((kitchenReadyAt.getTime() - kitchenStartedAt.getTime()) / 1000 / 60);
      }, 0) / orders.length
    : 0;

  return {
    bottlenecks,
    avgWaitTime,
    avgPreparationTime,
    totalOrdersAnalyzed: orders.length,
  };
}
