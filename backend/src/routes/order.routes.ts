import { Router } from "express";
import {
  createOrder,
  listMyOrders,
  getOrder,
  reorder,
  listAllOrders,
  updateOrderStatus,
} from "../controllers/order.controller";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.post("/", createOrder);
router.get("/", listMyOrders);
router.get("/admin/all", requireAdmin, listAllOrders);
router.get("/:id", getOrder);
router.post("/:id/reorder", reorder);
router.put("/:id/status", requireAdmin, updateOrderStatus);

export default router;
