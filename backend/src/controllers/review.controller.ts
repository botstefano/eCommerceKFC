import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";

export async function listReviews(req: Request, res: Response) {
  const reviews = await prisma.review.findMany({
    where: { productId: req.params.productId },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json({ reviews });
}

export async function createReview(req: Request, res: Response) {
  const { productId, rating, comment } = req.body as { productId: string; rating: number; comment?: string };
  if (rating < 1 || rating > 5) throw new ApiError(400, "El rating debe estar entre 1 y 5");

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new ApiError(404, "Producto no encontrado");

  const review = await prisma.review.create({
    data: { userId: (req as any).user!.userId, productId, rating, comment },
  });
  res.status(201).json({ review });
}
