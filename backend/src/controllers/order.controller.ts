import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import { createPaymentIntent } from "../services/stripeService";
import { awardPointsForOrder } from "../services/loyaltyService";
import { registerSale } from "../services/inventoryService";

type CartItem = { productId: string; quantity: number };

const ORDER_TYPES = ["DELIVERY", "PICKUP", "DINE_IN", "DRIVE_THRU"] as const;

function assignTable(): string {
  return `Mesa ${Math.floor(Math.random() * 30) + 1}`;
}

export async function createOrder(req: Request, res: Response) {
  const { items, type, address, branchId, scheduledTime, specialInstructions, promoCode, paymentMethod } = req.body as {
    items: CartItem[];
    type: string;
    address?: any;
    branchId?: string;
    scheduledTime?: string;
    specialInstructions?: string;
    promoCode?: string;
    paymentMethod?: string;
  };

  if (!Array.isArray(items) || items.length === 0) throw new ApiError(400, "El pedido debe tener al menos un producto");
  if (!ORDER_TYPES.includes(type as any)) throw new ApiError(400, "Tipo de pedido inválido");

  // ---- Order-type specific requirements ----
  let orderAddress: any = null;
  let orderScheduledTime: Date | null = null;

  if (type === "DELIVERY") {
    if (!address || !address.street) throw new ApiError(400, "Delivery requiere una dirección");
    orderAddress = address;
  } else if (type === "PICKUP") {
    if (!branchId) throw new ApiError(400, "Pickup requiere una sucursal");
    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) throw new ApiError(404, "Sucursal no encontrada");
    if (!scheduledTime) throw new ApiError(400, "Pickup requiere un horario programado");
    orderScheduledTime = new Date(scheduledTime);
    orderAddress = { branchId, branchName: branch.name, branchAddress: branch.address };
  } else if (type === "DINE_IN") {
    orderAddress = { table: assignTable() };
  }
  // DRIVE_THRU: no extra requirements

  // ---- Price calculation ----
  const products = await prisma.product.findMany({ where: { id: { in: items.map((i) => i.productId) } } });
  const productMap = new Map<string, (typeof products)[number]>();
  for (const p of products) productMap.set(p.id, p);

  let subtotal = 0;
  const lineItems = items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) throw new ApiError(404, `Producto ${item.productId} no encontrado`);
    if (product.stock < item.quantity) throw new ApiError(400, `Stock insuficiente para ${product.name}`);
    subtotal += product.price * item.quantity;
    return { productId: product.id, name: product.name, price: product.price, quantity: item.quantity };
  });

  let discount = 0;
  let appliedPromotion: any = null;
  if (promoCode) {
    const promo = await prisma.promotion.findUnique({ where: { code: promoCode.toUpperCase() } });
    if (!promo || !promo.active || promo.validUntil < new Date() || promo.usedCount >= promo.usageLimit) {
      throw new ApiError(400, "Cupón inválido o expirado");
    }
    discount = promo.discountType === "PERCENTAGE" ? subtotal * (promo.discountValue / 100) : promo.discountValue;
    appliedPromotion = promo;
  }

  const deliveryFee = type === "DELIVERY" ? 5 : 0;
  const total = Math.max(0, Math.round((subtotal - discount + deliveryFee) * 100) / 100);

  // ---- Payment (Stripe test mode / simulated) ----
  const paymentIntent = await createPaymentIntent(Math.round(total * 100));

  // ---- Persist order ----
  const order = await prisma.order.create({
    data: {
      userId: (req as any).user!.userId,
      items: lineItems,
      total,
      type: type as any,
      address: orderAddress,
      branchId: branchId || null,
      scheduledTime: orderScheduledTime,
      specialInstructions,
      paymentMethod: paymentMethod || "card",
      status: "PENDING",
    },
  });

  // ---- Decrement stock, award loyalty points, mark promo as used ----
  await Promise.all([
    ...lineItems.map((li) =>
      prisma.product.update({ where: { id: li.productId }, data: { stock: { decrement: li.quantity } } })
    ),
    ...lineItems.map((li) =>
      registerSale(li.productId, li.quantity)
    ),
    prisma.cart.update({ where: { userId: (req as any).user!.userId }, data: { items: [] } }).catch(() => null),
    appliedPromotion ? prisma.promotion.update({ where: { id: appliedPromotion.id }, data: { usedCount: { increment: 1 } } }) : Promise.resolve(),
  ]);

  const loyalty = await awardPointsForOrder((req as any).user!.userId, total);
  await prisma.order.update({ where: { id: order.id }, data: { pointsEarned: loyalty.pointsEarned } });

  res.status(201).json({
    order: { ...order, pointsEarned: loyalty.pointsEarned },
    payment: paymentIntent,
    loyalty,
    discountApplied: discount,
  });
}

export async function listMyOrders(req: Request, res: Response) {
  const orders = await prisma.order.findMany({
    where: { userId: (req as any).user!.userId },
    orderBy: { createdAt: "desc" },
  });
  res.json({ orders });
}

const STATUS_TIMELINE = ["PENDING", "PREPARING", "READY", "ON_THE_WAY", "DELIVERED"];

export async function getOrder(req: Request, res: Response) {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) throw new ApiError(404, "Pedido no encontrado");
  if (order.userId !== (req as any).user!.userId && (req as any).user!.role !== "ADMIN") {
    throw new ApiError(403, "No tienes acceso a este pedido");
  }

  const timeline =
    order.type === "PICKUP" || order.type === "DRIVE_THRU"
      ? ["PENDING", "PREPARING", "READY"]
      : order.type === "DINE_IN"
      ? ["PENDING", "PREPARING", "READY", "DELIVERED"]
      : STATUS_TIMELINE;

  res.json({ order, timeline, currentStepIndex: timeline.indexOf(order.status) });
}

export async function reorder(req: Request, res: Response) {
  const original = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!original) throw new ApiError(404, "Pedido no encontrado");
  if (original.userId !== (req as any).user!.userId) throw new ApiError(403, "No autorizado");

  const items = original.items as { productId: string; quantity: number }[];
  const cart = await prisma.cart.upsert({
    where: { userId: (req as any).user!.userId },
    update: {},
    create: { userId: (req as any).user!.userId, items: [] },
  });
  const existingItems = (cart.items as any[]) || [];
  for (const item of items) {
    const found = existingItems.find((i) => i.productId === item.productId);
    if (found) found.quantity += item.quantity;
    else existingItems.push({ productId: item.productId, quantity: item.quantity });
  }
  await prisma.cart.update({ where: { userId: (req as any).user!.userId }, data: { items: existingItems } });
  res.json({ message: "Productos agregados al carrito", items: existingItems });
}

// ---- Admin ----
export async function listAllOrders(_req: Request, res: Response) {
  const orders = await prisma.order.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json({ orders });
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["ON_THE_WAY", "DELIVERED"],
  ON_THE_WAY: ["DELIVERED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export async function updateOrderStatus(req: Request, res: Response) {
  const { status } = req.body as { status: string };
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) throw new ApiError(404, "Pedido no encontrado");

  const allowed = VALID_TRANSITIONS[order.status] || [];
  if (!allowed.includes(status)) {
    throw new ApiError(400, `No se puede pasar de ${order.status} a ${status}`);
  }

  const updated = await prisma.order.update({ where: { id: req.params.id }, data: { status: status as any } });
  res.json({ order: updated });
}
