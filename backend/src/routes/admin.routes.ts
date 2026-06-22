import { Router } from "express";
import {
  dashboardSummary,
  simulationMlVsNoMl,
  simulationMlVsNoMlPdf,
  simulationTraffic,
  simulationInventory,
  simulationStaffing,
  simulationDelivery,
} from "../controllers/admin.controller";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();
router.use(requireAuth, requireAdmin);

router.get("/dashboard", dashboardSummary);
router.get("/simulations/ml-vs-no-ml", simulationMlVsNoMl);
router.get("/simulations/ml-vs-no-ml/pdf", simulationMlVsNoMlPdf);
router.get("/simulations/traffic", simulationTraffic);
router.get("/simulations/inventory", simulationInventory);
router.get("/simulations/staffing", simulationStaffing);
router.get("/simulations/delivery", simulationDelivery);

export default router;
