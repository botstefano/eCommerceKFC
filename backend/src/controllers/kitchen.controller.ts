import { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import {
  getKitchenBoard,
  startPreparation,
  markQualityChecked,
  markReady,
  getBottlenecks,
} from "../services/kitchenService";

export async function getKitchenBoardHandler(_req: Request, res: Response) {
  const board = await getKitchenBoard();
  res.json({ board });
}

export async function startPreparationHandler(req: Request, res: Response) {
  const order = await startPreparation(req.params.orderId);
  res.json({ order });
}

export async function markQualityCheckedHandler(req: Request, res: Response) {
  const order = await markQualityChecked(req.params.orderId);
  res.json({ order });
}

export async function markReadyHandler(req: Request, res: Response) {
  const order = await markReady(req.params.orderId);
  res.json({ order });
}

export async function getBottlenecksHandler(_req: Request, res: Response) {
  const bottlenecks = await getBottlenecks();
  res.json(bottlenecks);
}
