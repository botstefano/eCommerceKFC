import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import { checkReorderThresholds, receivePurchaseOrder, getStockMovements } from "../services/inventoryService";

export async function getStockMovementsHandler(req: Request, res: Response) {
  const productId = req.query.productId as string | undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  
  const movements = await getStockMovements(productId, limit);
  res.json({ movements });
}

export async function getPurchaseOrders(req: Request, res: Response) {
  const status = req.query.status as string | undefined;
  
  const where = status ? { status } : {};
  const orders = await prisma.purchaseOrder.findMany({
    where,
    include: {
      supplier: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      product: {
        select: {
          id: true,
          name: true,
          category: true,
          stock: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  
  res.json({ orders });
}

export async function receivePurchaseOrderHandler(req: Request, res: Response) {
  const { receivedQuantity } = req.body as { receivedQuantity: number };
  
  if (!receivedQuantity || receivedQuantity <= 0) {
    throw new ApiError(400, "La cantidad recibida debe ser mayor a 0");
  }
  
  const purchaseOrder = await receivePurchaseOrder(req.params.id, receivedQuantity);
  res.json({ 
    message: "Orden de compra recibida exitosamente",
    purchaseOrder 
  });
}

export async function checkReorderHandler(_req: Request, res: Response) {
  await checkReorderThresholds();
  res.json({ message: "Verificación de umbrales de reorden completada" });
}

export async function getSuppliers(_req: Request, res: Response) {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
  });
  res.json({ suppliers });
}

export async function createSupplier(req: Request, res: Response) {
  const { name, contact, email, phone, leadTimeDays } = req.body as {
    name: string;
    contact?: string;
    email?: string;
    phone?: string;
    leadTimeDays?: number;
  };
  
  if (!name) {
    throw new ApiError(400, "El nombre del proveedor es requerido");
  }
  
  const supplier = await prisma.supplier.create({
    data: {
      name,
      contact,
      email,
      phone,
      leadTimeDays: leadTimeDays || 3,
    },
  });
  
  res.status(201).json({ supplier });
}

export async function updateSupplier(req: Request, res: Response) {
  const { name, contact, email, phone, leadTimeDays } = req.body as {
    name?: string;
    contact?: string;
    email?: string;
    phone?: string;
    leadTimeDays?: number;
  };
  
  const supplier = await prisma.supplier.update({
    where: { id: req.params.id },
    data: {
      ...(name && { name }),
      ...(contact !== undefined && { contact }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(leadTimeDays !== undefined && { leadTimeDays }),
    },
  });
  
  res.json({ supplier });
}

export async function deleteSupplier(req: Request, res: Response) {
  await prisma.supplier.delete({
    where: { id: req.params.id },
  });
  
  res.json({ message: "Proveedor eliminado exitosamente" });
}
