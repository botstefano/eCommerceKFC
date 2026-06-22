import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";

export async function listFavorites(req: Request, res: Response) {
  const favorites = await prisma.favorite.findMany({
    where: { userId: (req as any).user!.userId },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ favorites });
}

export async function addFavorite(req: Request, res: Response) {
  const { productId } = req.body as { productId: string };
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new ApiError(404, "Producto no encontrado");

  const favorite = await prisma.favorite
    .create({ data: { userId: (req as any).user!.userId, productId } })
    .catch(() => null);
  if (!favorite) throw new ApiError(409, "Ya está en tus favoritos");

  res.status(201).json({ favorite });
}

export async function removeFavorite(req: Request, res: Response) {
  await prisma.favorite
    .delete({ where: { userId_productId: { userId: (req as any).user!.userId, productId: req.params.productId } } })
    .catch(() => {
      throw new ApiError(404, "Favorito no encontrado");
    });
  res.status(204).send();
}
