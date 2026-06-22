import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import { REWARDS, redeemReward } from "../services/loyaltyService";

function publicUser(user: any) {
  const { password, ...rest } = user;
  return rest;
}

export async function updateProfile(req: Request, res: Response) {
  const { name, phone, preferences } = req.body as { name?: string; phone?: string; preferences?: any };
  const user = await prisma.user.update({
    where: { id: (req as any).user!.userId },
    data: { name, phone, preferences },
  });
  res.json({ user: publicUser(user) });
}

export async function updateAddresses(req: Request, res: Response) {
  const { addresses } = req.body as { addresses: any[] };
  const user = await prisma.user.update({
    where: { id: (req as any).user!.userId },
    data: { addresses },
  });
  res.json({ user: publicUser(user) });
}

export async function getLoyaltyStatus(req: Request, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: (req as any).user!.userId } });
  if (!user) throw new ApiError(404, "Usuario no encontrado");

  const thresholds = { SILVER: 0, GOLD: 500, PLATINUM: 1500 };
  const nextLevel = user.loyaltyLevel === "SILVER" ? "GOLD" : user.loyaltyLevel === "GOLD" ? "PLATINUM" : null;
  const pointsToNextLevel = nextLevel ? thresholds[nextLevel as "GOLD" | "PLATINUM"] - user.loyaltyPoints : 0;

  res.json({
    points: user.loyaltyPoints,
    level: user.loyaltyLevel,
    nextLevel,
    pointsToNextLevel: Math.max(0, pointsToNextLevel),
    rewards: REWARDS,
  });
}

export async function redeemLoyaltyReward(req: Request, res: Response) {
  const { rewardId } = req.body as { rewardId: string };
  const result = await redeemReward((req as any).user!.userId, rewardId);
  res.json(result);
}
