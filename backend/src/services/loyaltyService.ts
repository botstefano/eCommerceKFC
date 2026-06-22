import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";

// 1 point per S/ 1 spent (configurable). Levels are based on accumulated lifetime points.
export const POINTS_PER_CURRENCY_UNIT = 1;

export const LOYALTY_THRESHOLDS = {
  SILVER: 0,
  GOLD: 500,
  PLATINUM: 1500,
};

export const REWARDS = [
  { id: "free_side", name: "Acompañamiento gratis", cost: 150 },
  { id: "free_drink", name: "Bebida gratis", cost: 100 },
  { id: "discount_10", name: "10% de descuento en tu próxima orden", cost: 300 },
  { id: "free_combo_individual", name: "Combo individual gratis", cost: 600 },
  { id: "free_bucket", name: "Bucket familiar gratis", cost: 1200 },
];

export function computeLevel(points: number): "SILVER" | "GOLD" | "PLATINUM" {
  if (points >= LOYALTY_THRESHOLDS.PLATINUM) return "PLATINUM";
  if (points >= LOYALTY_THRESHOLDS.GOLD) return "GOLD";
  return "SILVER";
}

export async function awardPointsForOrder(userId: string, orderTotal: number) {
  const pointsEarned = Math.round(orderTotal * POINTS_PER_CURRENCY_UNIT);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "Usuario no encontrado");

  const newPoints = user.loyaltyPoints + pointsEarned;
  const newLevel = computeLevel(newPoints);

  await prisma.user.update({
    where: { id: userId },
    data: { loyaltyPoints: newPoints, loyaltyLevel: newLevel },
  });

  return { pointsEarned, totalPoints: newPoints, level: newLevel };
}

export async function redeemReward(userId: string, rewardId: string) {
  const reward = REWARDS.find((r) => r.id === rewardId);
  if (!reward) throw new ApiError(404, "Recompensa no encontrada");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "Usuario no encontrado");

  if (user.loyaltyPoints < reward.cost) {
    throw new ApiError(400, "No tienes suficientes puntos para esta recompensa");
  }

  const remaining = user.loyaltyPoints - reward.cost;
  const newLevel = computeLevel(remaining);

  await prisma.user.update({
    where: { id: userId },
    data: { loyaltyPoints: remaining, loyaltyLevel: newLevel },
  });

  return { reward, remainingPoints: remaining, level: newLevel };
}
