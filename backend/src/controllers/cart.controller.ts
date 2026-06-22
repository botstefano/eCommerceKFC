import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";

type CartItem = { productId: string; quantity: number; notes?: string };

async function hydrateCart(items: CartItem[]) {
  if (items.length === 0) return [];
  const products = await prisma.product.findMany({ where: { id: { in: items.map((i) => i.productId) } } });
  const map = new Map<string, (typeof products)[number]>();
  for (const p of products) map.set(p.id, p);
  return items
    .filter((i) => map.has(i.productId))
    .map((i) => ({ ...i, product: map.get(i.productId) }));
}

export async function getCart(req: Request, res: Response) {
  const cart = await prisma.cart.upsert({
    where: { userId: (req as any).user!.userId },
    update: {},
    create: { userId: (req as any).user!.userId, items: [] },
  });
  const items = (cart.items as CartItem[]) || [];
  const hydrated = await hydrateCart(items);
  const total = hydrated.reduce((sum, i) => sum + i.product!.price * i.quantity, 0);
  res.json({ items: hydrated, total: Math.round(total * 100) / 100 });
}

// Replaces the whole cart — used to sync the guest cart (kept in localStorage
// on the frontend) into the server-side cart right after login.
export async function syncCart(req: Request, res: Response) {
  const items: CartItem[] = Array.isArray(req.body.items) ? req.body.items : [];
  const merged = new Map<string, CartItem>();
  for (const item of items) {
    if (!item.productId || item.quantity <= 0) continue;
    const existing = merged.get(item.productId);
    merged.set(item.productId, { productId: item.productId, quantity: (existing?.quantity || 0) + item.quantity });
  }

  const cart = await prisma.cart.upsert({
    where: { userId: (req as any).user!.userId },
    update: { items: [...merged.values()] },
    create: { userId: (req as any).user!.userId, items: [...merged.values()] },
  });

  const hydrated = await hydrateCart((cart.items as CartItem[]) || []);
  res.json({ items: hydrated });
}

export async function addItem(req: Request, res: Response) {
  const { productId, quantity } = req.body as { productId: string; quantity: number };
  if (!productId || !quantity || quantity <= 0) throw new ApiError(400, "productId y quantity son requeridos");

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new ApiError(404, "Producto no encontrado");

  const cart = await prisma.cart.upsert({
    where: { userId: (req as any).user!.userId },
    update: {},
    create: { userId: (req as any).user!.userId, items: [] },
  });

  const items = (cart.items as CartItem[]) || [];
  const existing = items.find((i) => i.productId === productId);
  if (existing) existing.quantity += quantity;
  else items.push({ productId, quantity });

  await prisma.cart.update({ where: { userId: (req as any).user!.userId }, data: { items } });
  const hydrated = await hydrateCart(items);
  res.json({ items: hydrated });
}

export async function updateItem(req: Request, res: Response) {
  const { quantity } = req.body as { quantity: number };
  const cart = await prisma.cart.findUnique({ where: { userId: (req as any).user!.userId } });
  if (!cart) throw new ApiError(404, "Carrito no encontrado");

  let items = (cart.items as CartItem[]) || [];
  if (quantity <= 0) {
    items = items.filter((i) => i.productId !== req.params.productId);
  } else {
    const item = items.find((i) => i.productId === req.params.productId);
    if (!item) throw new ApiError(404, "Producto no está en el carrito");
    item.quantity = quantity;
  }

  await prisma.cart.update({ where: { userId: (req as any).user!.userId }, data: { items } });
  const hydrated = await hydrateCart(items);
  res.json({ items: hydrated });
}

export async function removeItem(req: Request, res: Response) {
  const cart = await prisma.cart.findUnique({ where: { userId: (req as any).user!.userId } });
  if (!cart) throw new ApiError(404, "Carrito no encontrado");
  const items = ((cart.items as CartItem[]) || []).filter((i) => i.productId !== req.params.productId);
  await prisma.cart.update({ where: { userId: (req as any).user!.userId }, data: { items } });
  const hydrated = await hydrateCart(items);
  res.json({ items: hydrated });
}

export async function clearCart(req: Request, res: Response) {
  await prisma.cart.upsert({
    where: { userId: (req as any).user!.userId },
    update: { items: [] },
    create: { userId: (req as any).user!.userId, items: [] },
  });
  res.json({ items: [] });
}
