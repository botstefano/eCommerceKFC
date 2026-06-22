import { Request, Response } from "express";
import { getRecommendations } from "../services/recommendationService";

export async function recommend(req: Request, res: Response) {
  const { userId, productId, limit, hourOfDay, cartSize, q } = req.query as Record<string, string>;

  const results = await getRecommendations({
    userId: userId || (req as any).user?.userId,
    productId,
    limit: limit ? Number(limit) : undefined,
    hourOfDay: hourOfDay ? Number(hourOfDay) : undefined,
    cartSize: cartSize ? Number(cartSize) : undefined,
    query: q,
  });

  res.json({ recommendations: results });
}
