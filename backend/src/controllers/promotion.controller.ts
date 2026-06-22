import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";

export async function listActivePromotions(_req: Request, res: Response) {
  const promotions = await prisma.promotion.findMany({
    where: { active: true, validUntil: { gte: new Date() } },
    orderBy: { validUntil: "asc" },
  });
  res.json({ promotions });
}

export async function validatePromotion(req: Request, res: Response) {
  const { code, subtotal } = req.body as { code: string; subtotal: number };
  const promo = await prisma.promotion.findUnique({ where: { code: code?.toUpperCase() } });

  if (!promo || !promo.active || promo.validUntil < new Date() || promo.usedCount >= promo.usageLimit) {
    throw new ApiError(400, "Cupón inválido o expirado");
  }

  const discount = promo.discountType === "PERCENTAGE" ? subtotal * (promo.discountValue / 100) : promo.discountValue;
  res.json({ promotion: promo, discount: Math.round(discount * 100) / 100 });
}

export async function listAllPromotions(_req: Request, res: Response) {
  const promotions = await prisma.promotion.findMany({ orderBy: { createdAt: "desc" } });
  res.json({ promotions });
}

export async function createPromotion(req: Request, res: Response) {
  const body = { ...req.body, code: req.body.code?.toUpperCase() };
  const promotion = await prisma.promotion.create({ data: body });
  res.status(201).json({ promotion });
}

export async function updatePromotion(req: Request, res: Response) {
  const promotion = await prisma.promotion
    .update({ where: { id: req.params.id }, data: req.body })
    .catch(() => null);
  if (!promotion) throw new ApiError(404, "Promoción no encontrada");
  res.json({ promotion });
}

export async function deletePromotion(req: Request, res: Response) {
  await prisma.promotion.delete({ where: { id: req.params.id } }).catch(() => {
    throw new ApiError(404, "Promoción no encontrada");
  });
  res.status(204).send();
}
