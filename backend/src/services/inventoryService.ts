import { prisma } from "../lib/prisma";

const CRITICAL_THRESHOLD = 20;
const DEFAULT_LEAD_TIME_DAYS = 3;

export async function registerSale(productId: string, quantity: number) {
  await prisma.stockMovement.create({
    data: {
      productId,
      type: "SALE",
      quantity: -quantity, // negativo para salidas
      reason: "Venta de pedido",
    },
  });
}

export async function checkReorderThresholds() {
  const products = await prisma.product.findMany();
  const orders = await prisma.order.findMany({ select: { items: true, createdAt: true } });

  // Calcular ventas por producto (misma lógica que simulationService)
  const soldByProduct = new Map<string, number>();
  let earliestOrder = new Date();
  for (const order of orders) {
    if (order.createdAt < earliestOrder) earliestOrder = order.createdAt;
    const items = order.items as { productId: string; quantity: number }[];
    if (Array.isArray(items)) {
      for (const item of items) {
        soldByProduct.set(item.productId, (soldByProduct.get(item.productId) || 0) + item.quantity);
      }
    }
  }
  const daysOfHistory = Math.max(1, Math.ceil((Date.now() - earliestOrder.getTime()) / (1000 * 60 * 60 * 24)));

  // Obtener proveedores por categoría para asignar automáticamente
  const suppliers = await prisma.supplier.findMany();

  for (const product of products) {
    const totalSold = soldByProduct.get(product.id) || 0;
    const avgDailySales = totalSold > 0 ? totalSold / daysOfHistory : 1.5;
    const daysOfStockLeft = product.stock / avgDailySales;
    const leadTimeDays = DEFAULT_LEAD_TIME_DAYS;

    // Verificar si está bajo el umbral crítico
    const isCritical = product.stock < CRITICAL_THRESHOLD || daysOfStockLeft < leadTimeDays;

    if (isCritical) {
      // Verificar si ya existe una orden PENDING para este producto
      const existingPending = await prisma.purchaseOrder.findFirst({
        where: {
          productId: product.id,
          status: "PENDING",
        },
      });

      if (!existingPending) {
        // Calcular cantidad sugerida para reabastecer
        const suggestedReorder = Math.max(0, Math.round(avgDailySales * leadTimeDays * 2 - product.stock));

        if (suggestedReorder > 0) {
          // Asignar proveedor basado en categoría (simple heurística)
          const category = product.category.toLowerCase();
          let supplier = suppliers.find((s) => s.name.toLowerCase().includes(category));
          if (!supplier) supplier = suppliers[0]; // fallback al primer proveedor

          if (supplier) {
            await prisma.purchaseOrder.create({
              data: {
                supplierId: supplier.id,
                productId: product.id,
                quantity: suggestedReorder,
                status: "PENDING",
                isAutomatic: true,
              },
            });
          }
        }
      }
    }
  }
}

export async function receivePurchaseOrder(purchaseOrderId: string, receivedQuantity: number) {
  const purchaseOrder = await prisma.purchaseOrder.findUnique({
    where: { id: purchaseOrderId },
    include: { product: true },
  });

  if (!purchaseOrder) {
    throw new Error("Orden de compra no encontrada");
  }

  if (purchaseOrder.status !== "PENDING" && purchaseOrder.status !== "SENT") {
    throw new Error("Solo se pueden recibir órdenes en estado PENDING o SENT");
  }

  // Marcar como recibido
  await prisma.purchaseOrder.update({
    where: { id: purchaseOrderId },
    data: {
      status: "RECEIVED",
      receivedAt: new Date(),
    },
  });

  // Incrementar stock del producto
  await prisma.product.update({
    where: { id: purchaseOrder.productId },
    data: {
      stock: { increment: receivedQuantity },
    },
  });

  // Crear movimiento de stock
  await prisma.stockMovement.create({
    data: {
      productId: purchaseOrder.productId,
      type: "RESTOCK",
      quantity: receivedQuantity, // positivo para entradas
      reason: `Recepción de orden de compra #${purchaseOrderId}`,
    },
  });

  return purchaseOrder;
}

export async function getStockMovements(productId?: string, limit: number = 50) {
  const where = productId ? { productId } : {};
  const movements = await prisma.stockMovement.findMany({
    where,
    include: {
      product: {
        select: {
          id: true,
          name: true,
          category: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return movements;
}
