import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";

export async function listProducts(req: Request, res: Response) {
  const { category, search, sort, maxSpicy, excludeAllergen, minPrice, maxPrice } = req.query as Record<string, string>;

  const where: any = {};
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }
  if (maxSpicy) where.spicyLevel = { lte: Number(maxSpicy) };
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = Number(minPrice);
    if (maxPrice) where.price.lte = Number(maxPrice);
  }

  let products = await prisma.product.findMany({ where });

  if (excludeAllergen) {
    const allergen = excludeAllergen.toLowerCase();
    products = products.filter((p) => {
      const allergens = (p.allergens as string[]) || [];
      return !allergens.some((a) => a.toLowerCase() === allergen);
    });
  }

  if (sort === "price_asc") products.sort((a, b) => a.price - b.price);
  else if (sort === "price_desc") products.sort((a, b) => b.price - a.price);
  else if (sort === "name") products.sort((a, b) => a.name.localeCompare(b.name));

  res.json({ products, total: products.length });
}

export async function getProduct(req: Request, res: Response) {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { reviews: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" } } },
  });
  if (!product) throw new ApiError(404, "Producto no encontrado");

  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
      : null;

  res.json({ product, avgRating });
}

export async function listCategories(_req: Request, res: Response) {
  const categories = await prisma.product.findMany({
    select: { category: true },
    distinct: ["category"],
  });
  res.json({ categories: categories.map((c) => c.category) });
}

export async function createProduct(req: Request, res: Response) {
  const product = await prisma.product.create({ data: req.body });
  res.status(201).json({ product });
}

export async function updateProduct(req: Request, res: Response) {
  const product = await prisma.product
    .update({ where: { id: req.params.id }, data: req.body })
    .catch(() => null);
  if (!product) throw new ApiError(404, "Producto no encontrado");
  res.json({ product });
}

export async function deleteProduct(req: Request, res: Response) {
  await prisma.product.delete({ where: { id: req.params.id } }).catch(() => {
    throw new ApiError(404, "Producto no encontrado");
  });
  res.status(204).send();
}
