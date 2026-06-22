import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";

export async function listBranches(_req: Request, res: Response) {
  const branches = await prisma.branch.findMany({ orderBy: { name: "asc" } });
  res.json({ branches });
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function nearbyBranches(req: Request, res: Response) {
  const { lat, lng } = req.query as Record<string, string>;
  if (!lat || !lng) throw new ApiError(400, "lat y lng son requeridos");

  const branches = await prisma.branch.findMany();
  const withDistance = branches
    .map((b) => ({ ...b, distanceKm: Math.round(haversineKm(Number(lat), Number(lng), b.lat, b.lng) * 10) / 10 }))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  res.json({ branches: withDistance });
}

export async function createBranch(req: Request, res: Response) {
  const branch = await prisma.branch.create({ data: req.body });
  res.status(201).json({ branch });
}

export async function deleteBranch(req: Request, res: Response) {
  await prisma.branch.delete({ where: { id: req.params.id } }).catch(() => {
    throw new ApiError(404, "Sucursal no encontrada");
  });
  res.status(204).send();
}
