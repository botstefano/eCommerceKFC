import { Router } from "express";
import {
  listActivePromotions,
  validatePromotion,
  listAllPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
} from "../controllers/promotion.controller";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();

router.get("/", listActivePromotions);
router.post("/validate", validatePromotion);
router.get("/admin/all", requireAuth, requireAdmin, listAllPromotions);
router.post("/admin", requireAuth, requireAdmin, createPromotion);
router.put("/admin/:id", requireAuth, requireAdmin, updatePromotion);
router.delete("/admin/:id", requireAuth, requireAdmin, deletePromotion);

export default router;
