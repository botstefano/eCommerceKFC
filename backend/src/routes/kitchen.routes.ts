import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth";
import {
  getKitchenBoardHandler,
  startPreparationHandler,
  markQualityCheckedHandler,
  markReadyHandler,
  getBottlenecksHandler,
} from "../controllers/kitchen.controller";

const router = Router();

// All kitchen routes require authentication and admin role
router.use(requireAuth, requireAdmin);

// Kitchen board
router.get("/board", getKitchenBoardHandler);

// Order actions
router.post("/:orderId/start", startPreparationHandler);
router.post("/:orderId/quality-check", markQualityCheckedHandler);
router.post("/:orderId/ready", markReadyHandler);

// Bottlenecks analysis
router.get("/bottlenecks", getBottlenecksHandler);

export default router;
