import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { hashPassword, comparePassword } from "../utils/bcrypt";
import { signToken } from "../utils/jwt";
import { ApiError } from "../utils/ApiError";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function publicUser(user: any) {
  const { password, ...rest } = user;
  return rest;
}

export async function register(req: Request, res: Response) {
  const data = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new ApiError(409, "Ya existe una cuenta con este correo");

  const hashed = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashed,
      name: data.name,
      phone: data.phone,
    },
  });

  await prisma.cart.create({ data: { userId: user.id, items: [] } });

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  res.status(201).json({ user: publicUser(user), token });
}

export async function login(req: Request, res: Response) {
  const data = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) throw new ApiError(401, "Credenciales inválidas");

  const valid = await comparePassword(data.password, user.password);
  if (!valid) throw new ApiError(401, "Credenciales inválidas");

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  res.json({ user: publicUser(user), token });
}

export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: (req as any).user.userId } });
  if (!user) throw new ApiError(404, "Usuario no encontrado");
  res.json({ user: publicUser(user) });
}
